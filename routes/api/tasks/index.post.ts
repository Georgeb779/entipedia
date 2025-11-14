import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { isString, isEmpty, trim } from "lodash";

import { getDb, tasks } from "db";
import type { AuthUser, TaskPriority, TaskStatus } from "@/types";
import { isValidUUID } from "../../_utils/uuid.ts";

const toIsoString = (value: Date | string) =>
  value instanceof Date ? value.toISOString() : new Date(value).toISOString();

const ALLOWED_STATUSES: readonly TaskStatus[] = ["todo", "in_progress", "done"] as const;
const ALLOWED_PRIORITIES: readonly TaskPriority[] = ["low", "medium", "high"] as const;

type CreateTaskPayload = {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority | null;
  dueDate?: string | null;
  projectId?: string | null;
};

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const payload = await readBody<CreateTaskPayload>(event);
  const title = isString(payload?.title) ? trim(payload.title) : undefined;

  if (isEmpty(title)) {
    throw new HTTPError("Title is required.", { status: 400 });
  }

  const status = payload?.status ?? "todo";

  if (!ALLOWED_STATUSES.includes(status)) {
    throw new HTTPError("Invalid task status provided.", { status: 400 });
  }

  const priority = payload?.priority ?? null;

  if (priority && !ALLOWED_PRIORITIES.includes(priority)) {
    throw new HTTPError("Invalid task priority provided.", { status: 400 });
  }

  let dueDate: Date | null = null;

  if (payload?.dueDate) {
    const parsed = new Date(payload.dueDate);

    if (Number.isNaN(parsed.getTime())) {
      throw new HTTPError("Invalid due date.", { status: 400 });
    }

    dueDate = parsed;
  }

  const description = isString(payload?.description) ? trim(payload.description) : null;
  const trimmedDescription = isEmpty(description) ? null : description;
  const projectId =
    isString(payload?.projectId) && isValidUUID(payload.projectId) ? payload.projectId : null;

  const db = getDb();

  try {
    const [newTask] = await db
      .insert(tasks)
      .values({
        title: title!,
        description: trimmedDescription,
        status,
        priority,
        dueDate,
        projectId,
        userId: context.user.id,
      })
      .returning();

    if (!newTask) {
      throw new HTTPError("Failed to create task.", { status: 500 });
    }

    return {
      task: {
        ...newTask,
        dueDate: newTask.dueDate ? toIsoString(newTask.dueDate) : null,
        createdAt: toIsoString(newTask.createdAt),
        updatedAt: toIsoString(newTask.updatedAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to create task.", { status: 500 });
  }
});
