import { eq } from "drizzle-orm";
import { getDb, rateLimits } from "db";

const RATE_LIMIT_MS = 120000; // 2 minutes

/**
 * Checks if an email has exceeded the rate limit for verification email resends.
 * Updates the last request timestamp if the limit has not been exceeded.
 * @param email - The email address to check
 * @returns true if rate limit is exceeded, false otherwise
 * @throws HTTPError with status 429 if rate limit is exceeded
 */
export async function checkRateLimit(email: string): Promise<boolean> {
  const db = getDb();
  const now = new Date();

  const [existingLimit] = await db
    .select()
    .from(rateLimits)
    .where(eq(rateLimits.email, email))
    .limit(1);

  if (existingLimit) {
    const timeSinceLastRequest = now.getTime() - existingLimit.lastRequestAt.getTime();

    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      return true;
    }

    await db.update(rateLimits).set({ lastRequestAt: now }).where(eq(rateLimits.email, email));
  } else {
    await db.insert(rateLimits).values({
      email,
      lastRequestAt: now,
    });
  }

  return false;
}
