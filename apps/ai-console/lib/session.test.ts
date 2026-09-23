import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import { issueOperatorSession, OPERATOR_ROLE, verifySession } from "./session.ts";

const SECRET = "session-signing-secret";
const OPERATOR = "operator-mint-token";

test("unsigned JSON cannot become a session", () => {
  const forged = JSON.stringify({ user_id: "ada", role: "admin" });
  assert.equal(verifySession(forged, SECRET), null);
});

test("a signed cookie with a privileged role other than operator is rejected", () => {
  const payload = Buffer.from(
    JSON.stringify({ user_id: "ada", role: "admin", exp: Date.now() + 60_000 }),
    "utf8"
  ).toString("base64url");
  const signature = createHmac("sha256", SECRET).update(`v1.${payload}`).digest("base64url");
  assert.equal(verifySession(`v1.${payload}.${signature}`, SECRET), null);
});

test("tampered signatures and expired cookies are rejected", () => {
  const issued = issueOperatorSession({
    body: { user_id: "ada" },
    authorization: `Bearer ${OPERATOR}`,
    operatorToken: OPERATOR,
    sessionSecret: SECRET,
    now: 1_000
  });
  assert.equal(issued.status, 200);
  assert.ok(issued.cookie);

  const [version, payload, signature] = issued.cookie.split(".");
  assert.equal(verifySession(`${version}.${payload}.${signature}x`, SECRET, 1_000), null);
  assert.equal(verifySession(issued.cookie, SECRET, 1_000 + 13 * 60 * 60 * 1000), null);
  const verified = verifySession(issued.cookie, SECRET, 1_000);
  assert.equal(verified?.role, OPERATOR_ROLE);
  assert.equal(verified?.user_id, "ada");
});

test("callers cannot choose a privileged role when minting a session", () => {
  const missingSecret = issueOperatorSession({
    body: { user_id: "ada", role: "admin" },
    authorization: `Bearer ${OPERATOR}`,
    operatorToken: OPERATOR,
    sessionSecret: undefined
  });
  assert.equal(missingSecret.status, 503);
  assert.equal(missingSecret.cookie, undefined);

  const missingToken = issueOperatorSession({
    body: { user_id: "ada", role: "admin" },
    authorization: undefined,
    operatorToken: undefined,
    sessionSecret: SECRET
  });
  assert.equal(missingToken.status, 503);

  const anonymous = issueOperatorSession({
    body: { user_id: "ada", role: "admin" },
    authorization: undefined,
    operatorToken: OPERATOR,
    sessionSecret: SECRET
  });
  assert.equal(anonymous.status, 401);
  assert.equal(anonymous.cookie, undefined);

  const wrong = issueOperatorSession({
    body: { user_id: "ada", role: "admin" },
    authorization: "Bearer wrong",
    operatorToken: OPERATOR,
    sessionSecret: SECRET
  });
  assert.equal(wrong.status, 401);

  const issued = issueOperatorSession({
    body: { user_id: "ada", role: "admin" },
    authorization: `Bearer ${OPERATOR}`,
    operatorToken: OPERATOR,
    sessionSecret: SECRET
  });
  assert.equal(issued.status, 200);
  assert.equal((issued.body.session as { role: string }).role, OPERATOR_ROLE);
  assert.equal(verifySession(issued.cookie ?? "", SECRET)?.role, OPERATOR_ROLE);
});
