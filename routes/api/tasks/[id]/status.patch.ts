import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, tasks } from "db";
import { toIsoString } from "../../../_utils/dates.ts";
import { isValidUUID } from "../../../_utils/uuid.ts";
import type { AuthUser, TaskStatus } from "@/types";

const ALLOWED_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];

type UpdateTaskStatusBody = {
  status?: TaskStatus;
};

/**
 * PATCH /api/tasks/:id/status
 * Optimized handler for updating only a task's status during drag-and-drop operations.
 * Performs ownership validation, accepts a limited payload, and returns the updated task.
 */
export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const taskId = idParam;

  if (!isValidUUID(taskId)) {
    throw new HTTPError("Invalid task id.", { status: 400 });
  }

  const body = (await readBody<UpdateTaskStatusBody>(event)) ?? {};
  const newStatus = body.status;

  if (!newStatus) {
    throw new HTTPError("Task status is required.", { status: 400 });
  }

  if (!ALLOWED_STATUSES.includes(newStatus)) {
    throw new HTTPError("Invalid task status. Must be one of: todo, in_progress, done.", {
      status: 400,
    });
  }

  const db = getDb();

  try {
    const [existingTask] = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, context.user.id)))
      .limit(1);

    if (!existingTask) {
      throw new HTTPError("Task not found or access denied.", { status: 404 });
    }

    const [updatedTask] = await db
      .update(tasks)
      .set({ status: newStatus })
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, context.user.id)))
      .returning();

    if (!updatedTask) {
      throw new HTTPError("Failed to update task status.", { status: 500 });
    }

    return {
      task: {
        ...updatedTask,
        dueDate: updatedTask.dueDate ? toIsoString(updatedTask.dueDate) : null,
        createdAt: toIsoString(updatedTask.createdAt),
        updatedAt: toIsoString(updatedTask.updatedAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to update task status.", { status: 500 });
  }
});
