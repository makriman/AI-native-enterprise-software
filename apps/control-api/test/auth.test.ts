import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import type { BuildRequest } from "@oae/shared-types";
import { createApp } from "../src/app.js";
import type { ControlApiConfig } from "../src/config.js";
import { AUTHENTICATED_ACTOR } from "../src/lib/actor.js";
import { MemoryStore } from "../src/store/memory-store.js";

const CONTROL_TOKEN = "control-test-token";
const EDGE_TOKEN = "edge-test-token";

function testConfig(overrides: Partial<ControlApiConfig> = {}): ControlApiConfig {
  return {
    port: 0,
    host: "127.0.0.1",
    repoRoot: tmpdir(),
    artifactRoot: tmpdir(),
    stateStorePath: path.join(mkdtempSync(path.join(tmpdir(), "oae-auth-")), "state.json"),
    policyProfileDefault: "standard",
    apiToken: CONTROL_TOKEN,
    edgeAgentToken: EDGE_TOKEN,
    ...overrides
  };
}

function seedBuild(store: MemoryStore, id = "build_test"): void {
  const now = new Date().toISOString();
  const request: BuildRequest = {
    id,
    workspaceId: "ws_default",
    instanceId: "inst_default",
    title: "Auth test",
    prompt: "Do not trust the caller",
    attachments: [],
    executionMode: "managed_api",
    deploymentPath: ["sandbox", "staging", "production"],
    riskTolerance: "medium",
    autoDeploySandbox: false,
    status: "awaiting_approval",
    createdBy: "system",
    createdAt: now,
    updatedAt: now
  };

  store.createBuild({
    request,
    artifacts: [],
    findings: [],
    testStatus: "passed",
    previews: []
  });
}

function appWith(overrides: Partial<ControlApiConfig> = {}) {
  const config = testConfig(overrides);
  const store = new MemoryStore({ stateFilePath: config.stateStorePath });
  seedBuild(store);
  store.createDeployment({
    id: "dep_test",
    buildRequestId: "build_test",
    buildRunId: "run_test",
    targetEnvironment: "sandbox",
    status: "succeeded",
    strategy: "rolling"
  });
  store.createEdgeJob({
    id: "edgejob_test",
    workspaceId: "ws_default",
    buildId: "build_test",
    spec: { ok: true },
    status: "queued"
  });
  return { app: createApp(config, store), store };
}

test("health stays open when secrets are unset", async () => {
  const { app } = appWith({ apiToken: undefined, edgeAgentToken: undefined });
  const response = await app.inject({ method: "GET", url: "/health" });
  assert.equal(response.statusCode, 200);
  await app.close();
});

test("unauthenticated callers cannot approve, deploy, or rollback", async () => {
  const { app, store } = appWith();

  const approve = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/approve",
    payload: { actor: "attacker", comment: "forged" }
  });
  assert.equal(approve.statusCode, 401);
  assert.equal(store.getBuild("build_test")?.request.status, "awaiting_approval");

  const deploy = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/deploy",
    payload: {
      target_environment: "production",
      approved_snapshot_id: "snap_test",
      actor: "attacker"
    }
  });
  assert.equal(deploy.statusCode, 401);

  const rollback = await app.inject({
    method: "POST",
    url: "/api/v1/deployments/dep_test/rollback",
    payload: { actor: "attacker", reason: "forged" }
  });
  assert.equal(rollback.statusCode, 401);
  assert.equal(store.getDeployment("dep_test")?.deployment.status, "succeeded");

  await app.close();
});

test("privileged routes fail closed when CONTROL_API_TOKEN is unset", async () => {
  const { app } = appWith({ apiToken: undefined });
  const response = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/approve",
    headers: { authorization: `Bearer ${CONTROL_TOKEN}` },
    payload: {}
  });
  assert.equal(response.statusCode, 503);
  assert.equal(response.json().error, "auth_not_configured");
  await app.close();
});

test("authenticated approve and rollback ignore the caller-supplied actor", async () => {
  const { app, store } = appWith();
  const headers = { authorization: `Bearer ${CONTROL_TOKEN}` };

  const approve = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/approve",
    headers,
    payload: { actor: "attacker", comment: "ship it" }
  });
  assert.equal(approve.statusCode, 200);
  const approvals = store.listApprovals("build_test");
  assert.equal(approvals.length, 1);
  assert.equal(approvals[0]?.actor, AUTHENTICATED_ACTOR);
  assert.equal(approvals[0]?.comment, "ship it");
  assert.equal(store.getBuild("build_test")?.request.status, "approved");

  const rollback = await app.inject({
    method: "POST",
    url: "/api/v1/deployments/dep_test/rollback",
    headers,
    payload: { actor: "attacker", reason: "bad release" }
  });
  assert.equal(rollback.statusCode, 200);
  const logs = store.getDeployment("dep_test")?.logs.join("\n") ?? "";
  assert.match(logs, new RegExp(AUTHENTICATED_ACTOR));
  assert.equal(logs.includes("attacker"), false);
  assert.equal(store.getDeployment("dep_test")?.deployment.status, "rolled_back");

  await app.close();
});

test("authenticated deploy is accepted and a wrong token is not", async () => {
  const { app } = appWith();
  const denied = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/deploy",
    headers: { authorization: "Bearer wrong-token" },
    payload: {
      target_environment: "sandbox",
      approved_snapshot_id: "snap_test"
    }
  });
  assert.equal(denied.statusCode, 401);

  const allowed = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/deploy",
    headers: { authorization: `Bearer ${CONTROL_TOKEN}` },
    payload: {
      target_environment: "sandbox",
      approved_snapshot_id: "snap_test"
    }
  });
  assert.equal(allowed.statusCode, 201);
  await app.close();
});

test("edge registration verifies the token and job claim requires it", async () => {
  const { app, store } = appWith();
  const edgeHeaders = { authorization: `Bearer ${EDGE_TOKEN}` };

  const ignoredToken = await app.inject({
    method: "POST",
    url: "/api/v1/connections/edge-agent/register",
    headers: edgeHeaders,
    payload: {
      workspace_id: "ws_default",
      name: "pretend-agent",
      host: "host",
      token: "not-the-real-token"
    }
  });
  assert.equal(ignoredToken.statusCode, 401);
  assert.equal(
    store.listConnections("ws_default").some((connection) => connection.name === "pretend-agent"),
    false
  );

  const missingHeader = await app.inject({
    method: "POST",
    url: "/api/v1/connections/edge-agent/register",
    payload: {
      workspace_id: "ws_default",
      name: "body-only",
      host: "host",
      token: EDGE_TOKEN
    }
  });
  assert.equal(missingHeader.statusCode, 401);

  const registered = await app.inject({
    method: "POST",
    url: "/api/v1/connections/edge-agent/register",
    headers: edgeHeaders,
    payload: {
      workspace_id: "ws_default",
      name: "real-agent",
      host: "host",
      token: EDGE_TOKEN
    }
  });
  assert.equal(registered.statusCode, 201);

  const claim = await app.inject({
    method: "GET",
    url: "/api/v1/edge/jobs/next?workspace_id=ws_default&agent_id=agent_attacker"
  });
  assert.equal(claim.statusCode, 401);
  assert.equal(store.claimEdgeJob("ws_default", "agent_real")?.id, "edgejob_test");

  await app.close();
});

test("edge routes fail closed when EDGE_AGENT_TOKEN is unset", async () => {
  const { app } = appWith({ edgeAgentToken: undefined });
  const response = await app.inject({
    method: "GET",
    url: "/api/v1/edge/jobs/next?workspace_id=ws_default&agent_id=agent_1",
    headers: { authorization: `Bearer ${EDGE_TOKEN}` }
  });
  assert.equal(response.statusCode, 503);
  await app.close();
});

test("operator token does not authorize edge routes and edge token does not authorize approve", async () => {
  const { app } = appWith();
  const edgeOnApprove = await app.inject({
    method: "POST",
    url: "/api/v1/builds/build_test/approve",
    headers: { authorization: `Bearer ${EDGE_TOKEN}` },
    payload: {}
  });
  assert.equal(edgeOnApprove.statusCode, 401);

  const controlOnEdge = await app.inject({
    method: "POST",
    url: "/api/v1/connections/edge-agent/heartbeat",
    headers: { authorization: `Bearer ${CONTROL_TOKEN}` },
    payload: { workspace_id: "ws_default", agent_id: "agent_1", status: "online" }
  });
  assert.equal(controlOnEdge.statusCode, 401);
  await app.close();
});
