import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, clients, type NewClient } from "db";
import type { AuthUser } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";
import { isValidUUID } from "../../_utils/uuid.ts";

type UpdateClientPayload = {
  name?: string;
  type?: "person" | "company";
  value?: number;
  startDate?: string;
  endDate?: string | null;
};

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const clientId = idParam;

  if (!isValidUUID(clientId)) {
    throw new HTTPError("Invalid client id.", { status: 400 });
  }

  const payload = await readBody<UpdateClientPayload>(event);
  const updateData: Partial<NewClient> = {};

  if (typeof payload?.name === "string") {
    const trimmed = payload.name.trim();

    if (!trimmed) {
      throw new HTTPError("Client name is required when provided.", { status: 400 });
    }

    if (trimmed.length > 255) {
      throw new HTTPError("Client name must be 255 characters or fewer.", { status: 400 });
    }

    updateData.name = trimmed;
  }

  if (payload?.type !== undefined) {
    if (payload.type !== "person" && payload.type !== "company") {
      throw new HTTPError("Client type must be either 'person' or 'company'.", { status: 400 });
    }

    updateData.type = payload.type;
  }

  if (payload?.value !== undefined) {
    if (
      typeof payload.value !== "number" ||
      !Number.isInteger(payload.value) ||
      payload.value <= 0
    ) {
      throw new HTTPError("Client value must be a positive integer.", { status: 400 });
    }

    updateData.value = payload.value;
  }

  if (payload?.startDate !== undefined) {
    if (!payload.startDate) {
      throw new HTTPError("Client start date cannot be empty when provided.", { status: 400 });
    }

    const parsedStart = new Date(payload.startDate);
    if (Number.isNaN(parsedStart.getTime())) {
      throw new HTTPError("Client start date must be a valid ISO date string.", {
        status: 400,
      });
    }

    updateData.startDate = parsedStart;
  }

  if (payload?.endDate !== undefined) {
    if (payload.endDate === null) {
      updateData.endDate = null;
    } else if (typeof payload.endDate === "string" && payload.endDate.length > 0) {
      const parsedEnd = new Date(payload.endDate);
      if (Number.isNaN(parsedEnd.getTime())) {
        throw new HTTPError("Client end date must be a valid ISO date string when provided.", {
          status: 400,
        });
      }
      updateData.endDate = parsedEnd;
    } else {
      throw new HTTPError(
        "Client end date must be null or a valid ISO date string when provided.",
        {
          status: 400,
        },
      );
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new HTTPError("No valid fields provided for update.", { status: 400 });
  }

  const db = getDb();

  try {
    const [existingClient] = await db
      .select()
      .from(clients)
      .where(and(eq(clients.id, clientId), eq(clients.userId, context.user.id)))
      .limit(1);

    if (!existingClient) {
      throw new HTTPError("Client not found or access denied.", { status: 404 });
    }

    const effectiveStartDate =
      (updateData.startDate as Date | undefined) ?? existingClient.startDate;
    const effectiveEndDate =
      updateData.endDate !== undefined
        ? (updateData.endDate as Date | null)
        : existingClient.endDate;

    if (effectiveEndDate && effectiveEndDate.getTime() <= effectiveStartDate.getTime()) {
      throw new HTTPError("Client end date must be after the start date.", { status: 400 });
    }

    const [updatedClient] = await db
      .update(clients)
      .set(updateData)
      .where(and(eq(clients.id, clientId), eq(clients.userId, context.user.id)))
      .returning();

    if (!updatedClient) {
      throw new HTTPError("Failed to update client.", { status: 500 });
    }

    return {
      client: {
        ...updatedClient,
        startDate: toIsoString(updatedClient.startDate),
        endDate: updatedClient.endDate ? toIsoString(updatedClient.endDate) : null,
        createdAt: toIsoString(updatedClient.createdAt),
        updatedAt: toIsoString(updatedClient.updatedAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to update client.", { status: 500 });
  }
});
