import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { eq } from "drizzle-orm";

import { getDb, users } from "db";
import { getSession } from "../../utils/session";
import { isValidUUID } from "../../_utils/uuid";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export default defineHandler(async (event) => {
  const session = await getSession<{ userId?: string | number }>(event);

  if (!session.data.userId) {
    throw new HTTPError("Not authenticated.", { status: 401 });
  }

  const userId = String(session.data.userId);
  if (!isValidUUID(userId)) {
    await session.clear();
    throw new HTTPError("Session invalid.", { status: 401 });
  }

  const db = getDb();

  try {
    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

    if (!user) {
      await session.clear();
      throw new HTTPError("Session invalid.", { status: 401 });
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
  } catch {
    await session.clear();
    throw new HTTPError("Session invalid.", { status: 401 });
  }
});
