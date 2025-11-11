import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, clients } from "db";
import type { AuthUser } from "@/types";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const clientId = Number.parseInt(idParam ?? "", 10);

  if (!Number.isInteger(clientId) || clientId <= 0) {
    throw new HTTPError("Invalid client id.", { statusCode: 400 });
  }

  const db = getDb();

  try {
    const [existingClient] = await db
      .select({ id: clients.id })
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, context.user.id)))
      .limit(1);

    if (!existingClient) {
      throw new HTTPError("Client not found or access denied.", { statusCode: 404 });
    }

    await db
      .delete(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, context.user.id)));

    return {
      success: true,
      message: "Client deleted successfully.",
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to delete client.", { statusCode: 500 });
  }
});
