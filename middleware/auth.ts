import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { eq } from "drizzle-orm";

import { getDb, users } from "db";
import type { AuthUser } from "@/types";
import { getSession } from "../routes/utils/session";

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
    session = await getSession<{ userId?: string }>(event);
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

  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, session.data.userId)).limit(1);

  if (!user) {
    await session.clear();
    return;
  }

  context.user = {
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  } satisfies AuthUser;
});
