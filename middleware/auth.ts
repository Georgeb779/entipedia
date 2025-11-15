import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { eq } from "drizzle-orm";

import { getDb, users } from "db";
import type { AuthUser } from "@/types";
import { getSession } from "../routes/utils/session";
import { isValidUUID } from "../routes/_utils/uuid";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };
  context.user = null;

  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    console.warn("SESSION_SECRET not set; skipping auth middleware");
    context.user = null;
    return;
  }

  let session;

  try {
    session = await getSession<{ userId?: string | number }>(event);
  } catch (error) {
    if (error instanceof HTTPError && error.status === 500) {
      console.warn("SESSION_SECRET not set; skipping auth middleware");
      context.user = null;
      return;
    }

    throw error;
  }

  if (!session.data.userId) {
    return;
  }

  const userId = String(session.data.userId);
  if (!isValidUUID(userId)) {
    await session.clear();
    return;
  }

  const db = getDb();

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      await session.clear();
      return;
    }

    context.user = {
      id: user.id,
      email: user.email,
      name: user.name,
      emailVerified: user.emailVerified,
      emailVerifiedAt: user.emailVerifiedAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    } satisfies AuthUser;
  } catch {
    // Handle database errors (e.g., invalid UUID format)
    await session.clear();
    return;
  }
});
