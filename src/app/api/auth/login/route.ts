import { NextResponse } from "next/server";
import { createSession, getSessionCookieConfig } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/auth/rate-limit";

export async function POST(request: Request) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";

  const { allowed, retryAfterMs } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      {
        error: "Too many login attempts. Please try again later.",
        retryAfterMs,
      },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    password?: string;
  };

  if (!body.password) {
    return NextResponse.json(
      { error: "Password is required" },
      { status: 400 }
    );
  }

  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "App password not configured" },
      { status: 500 }
    );
  }

  if (body.password !== appPassword) {
    return NextResponse.json(
      { error: "Incorrect password" },
      { status: 401 }
    );
  }

  const token = await createSession();
  const cookieConfig = getSessionCookieConfig(token);

  const response = NextResponse.json({ success: true });
  response.cookies.set(cookieConfig);

  return response;
}
