import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";

import { getDb, projects } from "db";
import type { AuthUser } from "@/types";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

type CreateProjectPayload = {
  name?: string;
  description?: string | null;
};

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const payload = await readBody<CreateProjectPayload>(event);
  const name = payload?.name?.trim();

  if (!name) {
    throw new HTTPError("Project name is required.", { statusCode: 400 });
  }

  if (name.length > 255) {
    throw new HTTPError("Project name must be 255 characters or fewer.", { statusCode: 400 });
  }

  const description = payload?.description?.trim() ?? null;

  const db = getDb();

  try {
    const [newProject] = await db
      .insert(projects)
      .values({
        name,
        description,
        userId: context.user.id,
      })
      .returning();

    if (!newProject) {
      throw new HTTPError("Failed to create project.", { statusCode: 500 });
    }

    return {
      project: {
        ...newProject,
        createdAt: toIsoString(newProject.createdAt),
        updatedAt: toIsoString(newProject.updatedAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to create project.", { statusCode: 500 });
  }
});
