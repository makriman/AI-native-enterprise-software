import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { issueOperatorSession, sessionCookieOptions, verifySession } from "../../../lib/session";

export async function GET() {
  const secret = process.env.CONSOLE_SESSION_SECRET?.trim();
  const raw = (await cookies()).get("oae_session")?.value;
  if (!secret || !raw) {
    return NextResponse.json({ authenticated: false });
  }

  const session = verifySession(raw, secret);
  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    session: {
      user_id: session.user_id,
      role: session.role
    }
  });
}

export async function POST(request: Request) {
  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    body = null;
  }

  const issued = issueOperatorSession({
    body,
    authorization: request.headers.get("authorization") ?? undefined,
    operatorToken: process.env.CONSOLE_OPERATOR_TOKEN,
    sessionSecret: process.env.CONSOLE_SESSION_SECRET
  });

  const response = NextResponse.json(issued.body, { status: issued.status });
  if (issued.cookie) {
    response.cookies.set("oae_session", issued.cookie, sessionCookieOptions());
  }
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("oae_session", "", {
    ...sessionCookieOptions(),
    maxAge: 0,
    expires: new Date(0)
  });
  return response;
}
