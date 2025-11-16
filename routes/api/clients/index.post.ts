import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";

import { getDb, clients } from "db";
import type { AuthUser } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";
import { checkRateLimit } from "../../utils/rate-limit.ts";

type CreateClientPayload = {
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

  const rateLimit = await checkRateLimit({
    identifier: context.user.id,
    scope: "clients:create",
    limit: 20,
    windowMs: 60_000,
  });

  if (rateLimit.limited) {
    throw new HTTPError(
      "Has alcanzado el límite de creación de clientes. Intenta nuevamente en unos segundos.",
      {
        status: 429,
        data: {
          code: "RATE_LIMITED",
          retryAfterMs: rateLimit.retryAfterMs ?? 0,
        },
      },
    );
  }

  const payload = await readBody<CreateClientPayload>(event);

  const name = payload?.name?.trim();
  if (!name) {
    throw new HTTPError("Client name is required.", { status: 400 });
  }
  if (name.length > 255) {
    throw new HTTPError("Client name must be 255 characters or fewer.", { status: 400 });
  }

  const clientType = payload?.type;
  if (clientType !== "person" && clientType !== "company") {
    throw new HTTPError("Client type must be either 'person' or 'company'.", { status: 400 });
  }

  const value = payload?.value;
  if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
    throw new HTTPError("Client value must be a positive integer.", { status: 400 });
  }

  const startDateInput = payload?.startDate;
  if (!startDateInput) {
    throw new HTTPError("Client start date is required.", { status: 400 });
  }
  const startDate = new Date(startDateInput);
  if (Number.isNaN(startDate.getTime())) {
    throw new HTTPError("Client start date must be a valid ISO date string.", { status: 400 });
  }

  const endDateInput = payload?.endDate;
  let endDate: Date | null = null;
  if (typeof endDateInput === "string" && endDateInput.length > 0) {
    endDate = new Date(endDateInput);
    if (Number.isNaN(endDate.getTime())) {
      throw new HTTPError("Client end date must be a valid ISO date string when provided.", {
        status: 400,
      });
    }
  } else if (endDateInput === null) {
    endDate = null;
  }

  if (endDate && endDate.getTime() <= startDate.getTime()) {
    throw new HTTPError("Client end date must be after the start date.", { status: 400 });
  }

  const db = getDb();

  try {
    const [newClient] = await db
      .insert(clients)
      .values({
        name,
        type: clientType,
        value,
        startDate,
        endDate,
        userId: context.user.id,
      })
      .returning();

    if (!newClient) {
      throw new HTTPError("Failed to create client.", { status: 500 });
    }

    return {
      client: {
        ...newClient,
        startDate: toIsoString(newClient.startDate),
        endDate: newClient.endDate ? toIsoString(newClient.endDate) : null,
        createdAt: toIsoString(newClient.createdAt),
        updatedAt: toIsoString(newClient.updatedAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to create client.", { status: 500 });
  }
});
