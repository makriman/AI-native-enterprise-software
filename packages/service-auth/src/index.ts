import { createHmac, timingSafeEqual } from "node:crypto";

const COMPARE_KEY = Buffer.from("oae-service-auth-compare");

export type AuthDecision =
  | { ok: true }
  | { ok: false; status: 401 | 503; error: "unauthorized" | "auth_not_configured" };

/**
 * Length-normalizing equality for shared secrets.
 * HMAC digests are fixed length, so timingSafeEqual does not throw or leak the secret length.
 */
export function tokensMatch(provided: string, expected: string): boolean {
  const left = createHmac("sha256", COMPARE_KEY).update(provided, "utf8").digest();
  const right = createHmac("sha256", COMPARE_KEY).update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}

export function readBearer(header: string | undefined): string | null {
  if (!header) {
    return null;
  }

  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

export function authorizeBearer(
  authorizationHeader: string | undefined,
  expectedSecret: string | undefined
): AuthDecision {
  const expected = expectedSecret?.trim();
  if (!expected) {
    return { ok: false, status: 503, error: "auth_not_configured" };
  }

  const provided = readBearer(authorizationHeader);
  if (!provided || !tokensMatch(provided, expected)) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true };
}

const EDGE_EXACT_PATHS = new Set([
  "/api/v1/connections/edge-agent/register",
  "/api/v1/connections/edge-agent/heartbeat",
  "/api/v1/edge/jobs/next"
]);

export function isEdgeAgentRoute(urlPath: string): boolean {
  const path = urlPath.split("?")[0] || urlPath;
  if (EDGE_EXACT_PATHS.has(path)) {
    return true;
  }

  return /^\/api\/v1\/edge\/jobs\/[^/]+\/complete$/.test(path);
}
