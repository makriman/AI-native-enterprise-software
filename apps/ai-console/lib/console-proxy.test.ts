import assert from "node:assert/strict";
import test from "node:test";
import { classifyConsoleProxy, stripCallerActor } from "./console-proxy.ts";

test("console proxy allowlist covers build mutations and streams only", () => {
  assert.equal(classifyConsoleProxy("POST", ["builds"]), "/api/v1/builds");
  assert.equal(classifyConsoleProxy("POST", ["builds", "build_123", "approve"]), "/api/v1/builds/build_123/approve");
  assert.equal(classifyConsoleProxy("POST", ["builds", "build_123", "deploy"]), "/api/v1/builds/build_123/deploy");
  assert.equal(classifyConsoleProxy("GET", ["builds", "build_123", "stream"]), "/api/v1/builds/build_123/stream");
  assert.equal(classifyConsoleProxy("POST", ["builds", "build_123", "rollback"]), null);
  assert.equal(classifyConsoleProxy("GET", ["builds"]), null);
  assert.equal(classifyConsoleProxy("POST", ["builds", "..", "approve"]), null);
  assert.equal(classifyConsoleProxy("POST", ["deployments", "dep_1", "rollback"]), null);
});

test("caller actor is removed before the control API sees the body", () => {
  assert.equal(stripCallerActor(JSON.stringify({ actor: "attacker", comment: "ok" })), JSON.stringify({ comment: "ok" }));
});
