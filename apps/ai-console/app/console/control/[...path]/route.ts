import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { classifyConsoleProxy, stripCallerActor } from "../../../../lib/console-proxy";
import { verifySession } from "../../../../lib/session";

interface ProxyContext {
  params: Promise<{ path: string[] }>;
}

async function proxy(request: Request, context: ProxyContext) {
  const { path } = await context.params;
  const upstreamPath = classifyConsoleProxy(request.method, path ?? []);
  if (!upstreamPath) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const sessionSecret = process.env.CONSOLE_SESSION_SECRET?.trim();
  const apiToken = process.env.CONTROL_API_TOKEN?.trim();
  if (!sessionSecret || !apiToken) {
    return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
  }

  const raw = (await cookies()).get("oae_session")?.value;
  const session = raw ? verifySession(raw, sessionSecret) : null;
  if (!session || session.role !== "operator") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const apiUrl = (process.env.CONTROL_API_URL || "http://localhost:4000").replace(/\/$/, "");
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${apiToken}`);

  let body: string | undefined;
  if (request.method !== "GET" && request.method !== "HEAD") {
    headers.set("Content-Type", "application/json");
    body = stripCallerActor(await request.text());
  }

  const upstream = await fetch(`${apiUrl}${upstreamPath}`, {
    method: request.method,
    headers,
    body,
    cache: "no-store"
  });

  if (upstreamPath.endsWith("/stream")) {
    return new Response(upstream.body, {
      status: upstream.status,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") || "text/event-stream",
        "Cache-Control": "no-cache"
      }
    });
  }

  return new NextResponse(await upstream.text(), {
    status: upstream.status,
    headers: {
      "Content-Type": upstream.headers.get("Content-Type") || "application/json"
    }
  });
}

export { proxy as GET, proxy as POST };
