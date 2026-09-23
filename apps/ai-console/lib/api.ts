const CONTROL_API_URL = process.env.CONTROL_API_URL || "http://localhost:4000";

export async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const token = process.env.CONTROL_API_TOKEN?.trim();
  if (!token) {
    throw new Error("CONTROL_API_TOKEN is not configured");
  }

  const response = await fetch(`${CONTROL_API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers || {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`API request failed (${response.status}) ${path}`);
  }

  return (await response.json()) as T;
}

export { CONTROL_API_URL };
