import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError } from "h3";
import { and, desc, eq } from "drizzle-orm";

import { getDb, projects, tasks } from "db";
import type { AuthUser } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";

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
    const [project] = await db
      .select()
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, context.user.id)))
      .limit(1);

    if (!project) {
      throw new HTTPError("Project not found or access denied.", { statusCode: 404 });
    }

    const projectTasks = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.projectId, projectId), eq(tasks.userId, context.user.id)))
      .orderBy(desc(tasks.createdAt));

    const serializedProject = {
      ...project,
      createdAt: toIsoString(project.createdAt),
      updatedAt: toIsoString(project.updatedAt),
    };

    const serializedTasks = projectTasks.map((task) => ({
      ...task,
      dueDate: task.dueDate ? toIsoString(task.dueDate) : null,
      createdAt: toIsoString(task.createdAt),
      updatedAt: toIsoString(task.updatedAt),
    }));

    return {
      project: serializedProject,
      tasks: serializedTasks,
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to fetch project.", { statusCode: 500 });
  }
});
