import { defineHandler } from "nitro/h3";
import { HTTPError, getQuery } from "h3";
import { asc, desc, eq, sql } from "drizzle-orm";

import { getDb, clients } from "db";
import type { AuthUser } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const db = getDb();

  try {
    const query = getQuery(event);
    const page = Number.isNaN(Number.parseInt((query.page as string) ?? "", 10))
      ? 1
      : Math.max(Number.parseInt((query.page as string) ?? "1", 10), 1);
    const parsedLimit = Number.isNaN(Number.parseInt((query.limit as string) ?? "", 10))
      ? 10
      : Math.max(Number.parseInt((query.limit as string) ?? "10", 10), 1);
    const limit = Math.min(parsedLimit, 100);
    const offset = (page - 1) * limit;

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(clients)
      .where(eq(clients.userId, context.user.id));

    const clientRows = await db
      .select()
      .from(clients)
      .where(eq(clients.userId, context.user.id))
      .limit(limit)
      .offset(offset)
      .orderBy(desc(clients.createdAt), asc(clients.id));

    const serializedClients = clientRows.map((client) => ({
      ...client,
      startDate: toIsoString(client.startDate),
      endDate: client.endDate ? toIsoString(client.endDate) : null,
      createdAt: toIsoString(client.createdAt),
      updatedAt: toIsoString(client.updatedAt),
    }));

    const total = Number(count);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);

    return {
      clients: serializedClients,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };
  } catch {
    throw new HTTPError("Failed to fetch clients.", { statusCode: 500 });
  }
});
