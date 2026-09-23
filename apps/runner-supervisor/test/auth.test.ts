import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../src/app.js";

const dispatchBody = {
  build_id: "build_1",
  execution_mode: "managed_api",
  workspace_id: "ws_default",
  instance_id: "inst_default",
  spec_path: "/tmp/spec.json"
};

test("runner health is public and dispatch fails closed without a token", async () => {
  const app = await createApp({ token: "" });
  const health = await app.inject({ method: "GET", url: "/health" });
  assert.equal(health.statusCode, 200);

  const dispatch = await app.inject({
    method: "POST",
    url: "/api/v1/runs/dispatch",
    payload: dispatchBody
  });
  assert.equal(dispatch.statusCode, 503);
  await app.close();
});

test("runner rejects unauthenticated dispatch and cancel", async () => {
  const app = await createApp({ token: "runner-token" });
  const headers = { authorization: "Bearer runner-token" };

  const denied = await app.inject({
    method: "POST",
    url: "/api/v1/runs/dispatch",
    payload: dispatchBody
  });
  assert.equal(denied.statusCode, 401);

  const dispatched = await app.inject({
    method: "POST",
    url: "/api/v1/runs/dispatch",
    headers,
    payload: dispatchBody
  });
  assert.equal(dispatched.statusCode, 202);
  const runId = dispatched.json().run_id as string;

  const cancelDenied = await app.inject({
    method: "POST",
    url: `/api/v1/runs/${runId}/cancel`
  });
  assert.equal(cancelDenied.statusCode, 401);

  const readDenied = await app.inject({
    method: "GET",
    url: `/api/v1/runs/${runId}`
  });
  assert.equal(readDenied.statusCode, 401);

  const cancelled = await app.inject({
    method: "POST",
    url: `/api/v1/runs/${runId}/cancel`,
    headers
  });
  assert.equal(cancelled.statusCode, 200);
  assert.equal(cancelled.json().status, "cancelled");
  await app.close();
});
