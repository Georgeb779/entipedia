import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, tasks } from "db";
import type { AuthUser } from "@/types";
import { isValidUUID } from "../../_utils/uuid.ts";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const taskId = idParam;

  if (!isValidUUID(taskId)) {
    throw new HTTPError("Invalid task id.", { statusCode: 400 });
  }

  const db = getDb();

  const [existingTask] = await db
    .select({ id: tasks.id })
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, context.user.id)))
    .limit(1);

  if (!existingTask) {
    throw new HTTPError("Task not found or access denied.", { statusCode: 404 });
  }

  try {
    await db.delete(tasks).where(and(eq(tasks.id, taskId), eq(tasks.userId, context.user.id)));

    return {
      success: true,
      message: "Task deleted successfully.",
    };
  } catch {
    throw new HTTPError("Failed to delete task.", { statusCode: 500 });
  }
});
