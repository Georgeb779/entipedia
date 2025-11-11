import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { asc, count, desc, eq, sql } from "drizzle-orm";

import { getDb, projects, tasks } from "db";
import type { AuthUser } from "@/types";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const db = getDb();

  try {
    const userProjects = await db
      .select({
        id: projects.id,
        name: projects.name,
        description: projects.description,
        userId: projects.userId,
        createdAt: projects.createdAt,
        updatedAt: projects.updatedAt,
        taskCount: count(tasks.id),
        completedTaskCount: sql<number>`count(case when ${tasks.status} = 'done' then 1 end)`,
      })
      .from(projects)
      .leftJoin(tasks, eq(tasks.projectId, projects.id))
      .where(eq(projects.userId, context.user.id))
      .groupBy(projects.id)
      .orderBy(desc(projects.createdAt), asc(projects.id));

    const serializedProjects = userProjects.map((project) => ({
      ...project,
      createdAt: toIsoString(project.createdAt),
      updatedAt: toIsoString(project.updatedAt),
    }));

    return { projects: serializedProjects };
  } catch {
    throw new HTTPError("Failed to fetch projects.", { statusCode: 500 });
  }
});
