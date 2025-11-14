import { defineHandler } from "nitro/h3";
import { HTTPError, getQuery } from "h3";
import { and, asc, count, desc, eq } from "drizzle-orm";

import { getDb, clients } from "db";
import type { AuthUser } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
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

    const typeFilter = (query.type as string | undefined) ?? undefined;
    const sortByParam = (query.sortBy as string | undefined) ?? "createdAt";
    const sortOrderParam = (query.sortOrder as string | undefined) ?? "desc";

    const sortColumn =
      {
        createdAt: clients.createdAt,
        name: clients.name,
        value: clients.value,
        startDate: clients.startDate,
      }[sortByParam as "createdAt" | "name" | "value" | "startDate"] ?? clients.createdAt;

    const orderClause = sortOrderParam === "asc" ? asc(sortColumn) : desc(sortColumn);

    const filters = [eq(clients.userId, context.user.id)];

    if (typeFilter === "person" || typeFilter === "company") {
      filters.push(eq(clients.type, typeFilter));
    }

    const whereClause = filters.length === 1 ? filters[0] : and(...filters);

    const [{ total: totalCount }] = await db
      .select({ total: count(clients.id) })
      .from(clients)
      .where(whereClause);

    const clientRows = await db
      .select()
      .from(clients)
      .where(whereClause)
      .orderBy(orderClause, asc(clients.id))
      .limit(limit)
      .offset(offset);

    const serializedClients = clientRows.map((client) => ({
      ...client,
      startDate: toIsoString(client.startDate),
      endDate: client.endDate ? toIsoString(client.endDate) : null,
      createdAt: toIsoString(client.createdAt),
      updatedAt: toIsoString(client.updatedAt),
    }));

    const total = Number(totalCount);
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
  } catch (error) {
    const maybeError = error as { cause?: unknown };
    const causeMessage =
      maybeError?.cause && maybeError.cause instanceof Error ? maybeError.cause.message : undefined;

    const message =
      causeMessage ?? (error instanceof Error ? error.message : "Failed to fetch clients.");

    throw new HTTPError(message, { status: 500, cause: error });
  }
});
