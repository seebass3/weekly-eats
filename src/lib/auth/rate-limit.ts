const attempts = new Map<string, { count: number; resetAt: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 60_000; // 1 minute
const LOCKOUT_MS = 15 * 60_000; // 15 minutes

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfterMs?: number;
} {
  const now = Date.now();
  const record = attempts.get(ip);

  // Clean up expired entries periodically
  if (Math.random() < 0.1) {
    for (const [key, val] of attempts) {
      if (now > val.resetAt) attempts.delete(key);
    }
  }

  if (!record || now > record.resetAt) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true };
  }

  if (record.count >= MAX_ATTEMPTS) {
    // Already hit limit — extend lockout
    record.resetAt = now + LOCKOUT_MS;
    return { allowed: false, retryAfterMs: LOCKOUT_MS };
  }

  record.count++;
  return { allowed: true };
}
