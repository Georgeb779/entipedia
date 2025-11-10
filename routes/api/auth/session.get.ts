import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { eq } from "drizzle-orm";

import { getDb, users } from "db";
import { getSession } from "../../utils/session";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export default defineHandler(async (event) => {
  const session = await getSession<{ userId?: number }>(event);

  if (!session.data.userId) {
    throw new HTTPError("Not authenticated.", { statusCode: 401 });
  }

  const db = getDb();

  const [user] = await db.select().from(users).where(eq(users.id, session.data.userId)).limit(1);

  if (!user) {
    await session.clear();
    throw new HTTPError("Session invalid.", { statusCode: 401 });
  }

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: toIsoString(user.createdAt),
      updatedAt: toIsoString(user.updatedAt),
    },
  };
});
