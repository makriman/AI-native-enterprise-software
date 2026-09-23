import assert from "node:assert/strict";
import test from "node:test";
import { authorizeBearer, isEdgeAgentRoute, tokensMatch } from "../src/index.ts";

test("tokensMatch rejects unequal secrets without throwing on length mismatch", () => {
  assert.equal(tokensMatch("correct-horse", "correct-horse"), true);
  assert.equal(tokensMatch("correct-horse", "correct-horses"), false);
  assert.equal(tokensMatch("a", "correct-horse"), false);
  assert.equal(tokensMatch("", "correct-horse"), false);
});

test("authorizeBearer fails closed when the secret is missing", () => {
  assert.deepEqual(authorizeBearer("Bearer secret", undefined), {
    ok: false,
    status: 503,
    error: "auth_not_configured"
  });
  assert.deepEqual(authorizeBearer("Bearer secret", "   "), {
    ok: false,
    status: 503,
    error: "auth_not_configured"
  });
});

test("authorizeBearer rejects missing and wrong bearer tokens", () => {
  assert.deepEqual(authorizeBearer(undefined, "secret"), {
    ok: false,
    status: 401,
    error: "unauthorized"
  });
  assert.deepEqual(authorizeBearer("secret", "secret"), {
    ok: false,
    status: 401,
    error: "unauthorized"
  });
  assert.deepEqual(authorizeBearer("Bearer wrong", "secret"), {
    ok: false,
    status: 401,
    error: "unauthorized"
  });
  assert.deepEqual(authorizeBearer("Bearer secret", "secret"), { ok: true });
  assert.deepEqual(authorizeBearer("bearer secret", "secret"), { ok: true });
});

test("edge agent routes are limited to registration, heartbeat, and job claim/complete", () => {
  assert.equal(isEdgeAgentRoute("/api/v1/connections/edge-agent/register"), true);
  assert.equal(isEdgeAgentRoute("/api/v1/connections/edge-agent/heartbeat?x=1"), true);
  assert.equal(isEdgeAgentRoute("/api/v1/edge/jobs/next"), true);
  assert.equal(isEdgeAgentRoute("/api/v1/edge/jobs/edgejob_abc/complete"), true);
  assert.equal(isEdgeAgentRoute("/api/v1/edge/jobs/enqueue"), false);
  assert.equal(isEdgeAgentRoute("/api/v1/builds/build_1/approve"), false);
  assert.equal(isEdgeAgentRoute("/health"), false);
});
