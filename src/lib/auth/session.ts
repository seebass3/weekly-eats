import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { hashSync, compareSync } from "bcryptjs";

const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "fallback-secret-change-me"
);
const COOKIE_NAME = "weekly-eats-session";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 90; // 90 days

export async function createSession(): Promise<string> {
  const token = await new SignJWT({ authenticated: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("90d")
    .sign(SESSION_SECRET);

  return token;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SESSION_SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getSessionFromCookies(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return false;
  return verifySession(token);
}

export function getSessionCookieConfig(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  };
}

export function hashPassword(password: string): string {
  return hashSync(password, 10);
}

export function verifyPassword(password: string, hash: string): boolean {
  return compareSync(password, hash);
}
