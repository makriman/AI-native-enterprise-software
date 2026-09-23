import { createHmac, timingSafeEqual } from "node:crypto";
import { z } from "zod";

export const OPERATOR_ROLE = "operator" as const;
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const COMPARE_KEY = Buffer.from("oae-service-auth-compare");

const mintSchema = z
  .object({
    user_id: z.string().trim().min(1).max(128)
  })
  .passthrough();

export interface OperatorSession {
  user_id: string;
  role: typeof OPERATOR_ROLE;
  exp: number;
}

export interface IssuedSession {
  status: number;
  body: Record<string, unknown>;
  cookie?: string;
}

function tokensMatch(provided: string, expected: string): boolean {
  const left = createHmac("sha256", COMPARE_KEY).update(provided, "utf8").digest();
  const right = createHmac("sha256", COMPARE_KEY).update(expected, "utf8").digest();
  return timingSafeEqual(left, right);
}

function readBearer(header: string | undefined): string | null {
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim());
  return match?.[1] ?? null;
}

function signaturesMatch(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    timingSafeEqual(right, right);
    return false;
  }
  return timingSafeEqual(left, right);
}

export function signSession(session: OperatorSession, secret: string): string {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
  const signature = createHmac("sha256", secret).update(`v1.${payload}`).digest("base64url");
  return `v1.${payload}.${signature}`;
}

export function verifySession(token: string, secret: string, now = Date.now()): OperatorSession | null {
  const trimmed = secret.trim();
  if (!trimmed) {
    return null;
  }

  const parts = token.split(".");
  if (parts.length !== 3 || parts[0] !== "v1") {
    return null;
  }

  const payload = parts[1] ?? "";
  const signature = parts[2] ?? "";
  const expected = createHmac("sha256", trimmed).update(`v1.${payload}`).digest("base64url");
  if (!signaturesMatch(signature, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as Partial<OperatorSession>;
    if (parsed.role !== OPERATOR_ROLE) {
      return null;
    }
    if (typeof parsed.user_id !== "string" || parsed.user_id.length < 1 || parsed.user_id.length > 128) {
      return null;
    }
    if (typeof parsed.exp !== "number" || !Number.isFinite(parsed.exp) || parsed.exp <= now) {
      return null;
    }
    return { user_id: parsed.user_id, role: OPERATOR_ROLE, exp: parsed.exp };
  } catch {
    return null;
  }
}

export function issueOperatorSession(input: {
  body: unknown;
  authorization: string | undefined;
  operatorToken: string | undefined;
  sessionSecret: string | undefined;
  now?: number;
}): IssuedSession {
  const secret = input.sessionSecret?.trim();
  const operatorToken = input.operatorToken?.trim();
  if (!secret || !operatorToken) {
    return { status: 503, body: { error: "auth_not_configured" } };
  }

  const provided = readBearer(input.authorization);
  if (!provided || !tokensMatch(provided, operatorToken)) {
    return { status: 401, body: { error: "unauthorized" } };
  }

  const parsed = mintSchema.safeParse(input.body);
  if (!parsed.success) {
    return { status: 400, body: { error: "invalid_request" } };
  }

  const session: OperatorSession = {
    user_id: parsed.data.user_id,
    role: OPERATOR_ROLE,
    exp: (input.now ?? Date.now()) + SESSION_TTL_MS
  };

  return {
    status: 200,
    body: {
      authenticated: true,
      session: {
        user_id: session.user_id,
        role: session.role
      }
    },
    cookie: signSession(session, secret)
  };
}

export function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  path: string;
  secure: boolean;
  maxAge: number;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.CONSOLE_COOKIE_SECURE === "true",
    maxAge: SESSION_TTL_MS / 1000
  };
}
