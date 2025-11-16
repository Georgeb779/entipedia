import { and, eq } from "drizzle-orm";
import { getDb, rateLimits } from "db";

type RateLimitOptions = {
  identifier: string;
  scope: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  limited: boolean;
  remaining: number;
  retryAfterMs?: number;
};

const normalizeIdentifier = (value: string) => value.trim().toLowerCase();

export async function checkRateLimit(options: RateLimitOptions): Promise<RateLimitResult> {
  const { identifier, scope, limit, windowMs } = options;
  const normalizedIdentifier = normalizeIdentifier(identifier);
  const db = getDb();
  const now = new Date();
  const windowBoundary = now.getTime() - windowMs;

  const [existingLimit] = await db
    .select()
    .from(rateLimits)
    .where(and(eq(rateLimits.identifier, normalizedIdentifier), eq(rateLimits.scope, scope)))
    .limit(1);

  if (!existingLimit) {
    await db.insert(rateLimits).values({
      identifier: normalizedIdentifier,
      scope,
      requestCount: 1,
      windowStartedAt: now,
      lastRequestAt: now,
    });

    return {
      limited: false,
      remaining: Math.max(limit - 1, 0),
    };
  }

  const windowStartedAtMs = existingLimit.windowStartedAt.getTime();

  if (windowStartedAtMs <= windowBoundary) {
    await db
      .update(rateLimits)
      .set({
        requestCount: 1,
        windowStartedAt: now,
        lastRequestAt: now,
      })
      .where(eq(rateLimits.id, existingLimit.id));

    return {
      limited: false,
      remaining: Math.max(limit - 1, 0),
    };
  }

  if (existingLimit.requestCount >= limit) {
    const elapsedMs = now.getTime() - windowStartedAtMs;
    const retryAfterMs = windowMs - elapsedMs;

    await db
      .update(rateLimits)
      .set({ lastRequestAt: now })
      .where(eq(rateLimits.id, existingLimit.id));

    return {
      limited: true,
      remaining: 0,
      retryAfterMs: retryAfterMs > 0 ? retryAfterMs : 0,
    };
  }

  const updatedCount = existingLimit.requestCount + 1;

  await db
    .update(rateLimits)
    .set({
      requestCount: updatedCount,
      lastRequestAt: now,
    })
    .where(eq(rateLimits.id, existingLimit.id));

  return {
    limited: false,
    remaining: Math.max(limit - updatedCount, 0),
  };
}
