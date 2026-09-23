const BUILD_ID = /^[A-Za-z0-9_-]+$/;
const ACTIONS = new Set(["approve", "reject", "request-changes", "deploy"]);

export function classifyConsoleProxy(method: string, segments: string[]): string | null {
  if (segments.length === 0 || segments.some((segment) => !BUILD_ID.test(segment) && segment !== "builds")) {
    return null;
  }

  if (method === "POST" && segments.length === 1 && segments[0] === "builds") {
    return "/api/v1/builds";
  }

  if (segments.length === 3 && segments[0] === "builds" && BUILD_ID.test(segments[1] ?? "")) {
    const action = segments[2] ?? "";
    if (method === "POST" && ACTIONS.has(action)) {
      return `/api/v1/builds/${segments[1]}/${action}`;
    }
    if (method === "GET" && action === "stream") {
      return `/api/v1/builds/${segments[1]}/stream`;
    }
  }

  return null;
}

export function stripCallerActor(body: string): string {
  if (!body) {
    return body;
  }

  try {
    const parsed = JSON.parse(body) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return body;
    }
    delete (parsed as Record<string, unknown>).actor;
    return JSON.stringify(parsed);
  } catch {
    return body;
  }
}
