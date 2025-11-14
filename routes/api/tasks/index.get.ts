import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { desc, eq } from "drizzle-orm";

import { getDb, tasks } from "db";
import type { AuthUser } from "@/types";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const db = getDb();

  try {
    const userTasks = await db
      .select()
      .from(tasks)
      .where(eq(tasks.userId, context.user.id))
      .orderBy(desc(tasks.createdAt));

    const serializedTasks = userTasks.map((task) => ({
      ...task,
      dueDate: task.dueDate ? toIsoString(task.dueDate) : null,
      createdAt: toIsoString(task.createdAt),
      updatedAt: toIsoString(task.updatedAt),
    }));

    return { tasks: serializedTasks };
  } catch {
    throw new HTTPError("Failed to fetch tasks.", { status: 500 });
  }
});
