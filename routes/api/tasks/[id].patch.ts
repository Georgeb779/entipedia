import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, tasks } from "db";
import type { AuthUser, TaskPriority, TaskStatus } from "@/types";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const ALLOWED_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"];
const ALLOWED_PRIORITIES: readonly TaskPriority[] = ["low", "medium", "high"];

type UpdateTaskPayload = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  projectId?: number | null;
};

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const taskId = Number.parseInt(idParam ?? "", 10);

  if (Number.isNaN(taskId)) {
    throw new HTTPError("Invalid task id.", { statusCode: 400 });
  }

  const payload = (await readBody<UpdateTaskPayload>(event)) ?? {};
  const db = getDb();

  const [existingTask] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.id, taskId), eq(tasks.userId, context.user.id)))
    .limit(1);

  if (!existingTask) {
    throw new HTTPError("Task not found or access denied.", { statusCode: 404 });
  }

  const updateData: Partial<typeof tasks.$inferInsert> = {};

  if (payload.title !== undefined) {
    const title = payload.title.trim();

    if (!title) {
      throw new HTTPError("Title cannot be empty.", { statusCode: 400 });
    }

    updateData.title = title;
  }

  if (payload.description !== undefined) {
    updateData.description = payload.description?.trim() ?? null;
  }

  if (payload.status !== undefined) {
    if (!ALLOWED_STATUSES.includes(payload.status)) {
      throw new HTTPError("Invalid task status provided.", { statusCode: 400 });
    }

    updateData.status = payload.status;
  }

  if (payload.priority !== undefined) {
    if (payload.priority !== null && !ALLOWED_PRIORITIES.includes(payload.priority)) {
      throw new HTTPError("Invalid task priority provided.", { statusCode: 400 });
    }

    updateData.priority = payload.priority;
  }

  if (payload.dueDate !== undefined) {
    if (payload.dueDate === null || payload.dueDate === "") {
      updateData.dueDate = null;
    } else {
      const parsed = new Date(payload.dueDate);

      if (Number.isNaN(parsed.getTime())) {
        throw new HTTPError("Invalid due date.", { statusCode: 400 });
      }

      updateData.dueDate = parsed;
    }
  }

  if (payload.projectId !== undefined) {
    if (payload.projectId === null) {
      updateData.projectId = null;
    } else if (typeof payload.projectId === "number") {
      updateData.projectId = payload.projectId;
    } else {
      throw new HTTPError("Invalid project id.", { statusCode: 400 });
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new HTTPError("No valid fields provided for update.", { statusCode: 400 });
  }

  try {
    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(and(eq(tasks.id, taskId), eq(tasks.userId, context.user.id)))
      .returning();

    if (!updatedTask) {
      throw new HTTPError("Failed to update task.", { statusCode: 500 });
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

    throw new HTTPError("Failed to update task.", { statusCode: 500 });
  }
});
