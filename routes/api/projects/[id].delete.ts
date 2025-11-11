import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, projects } from "db";
import type { AuthUser } from "@/types";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const projectId = Number.parseInt(idParam ?? "", 10);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HTTPError("Invalid project id.", { statusCode: 400 });
  }

  const db = getDb();

  try {
    const [existingProject] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, context.user.id)))
      .limit(1);

    if (!existingProject) {
      throw new HTTPError("Project not found or access denied.", { statusCode: 404 });
    }

    await db
      .delete(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, context.user.id)));

    return {
      success: true,
      message: "Project deleted successfully.",
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to delete project.", { statusCode: 500 });
  }
});
