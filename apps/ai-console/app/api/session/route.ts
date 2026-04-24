import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

const sessionSchema = z.object({
  user_id: z.string().min(1),
  role: z.string().min(1)
});

export async function GET() {
  const cookieStore = await cookies();
  const raw = cookieStore.get("oae_session")?.value;
  if (!raw) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const parsed = sessionSchema.parse(JSON.parse(raw));
    return NextResponse.json({ authenticated: true, session: parsed });
  } catch {
    return NextResponse.json({ authenticated: false });
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = sessionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const response = NextResponse.json({ authenticated: true, session: parsed.data });
  response.cookies.set("oae_session", JSON.stringify(parsed.data), {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ authenticated: false });
  response.cookies.set("oae_session", "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    expires: new Date(0)
  });
  return response;
}
