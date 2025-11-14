import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { isString, isEmpty, trim } from "lodash";

import { getDb, projects } from "db";
import type { NewProject } from "db/schema";
import type { AuthUser, ProjectPriority, ProjectStatus } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";

type CreateProjectPayload = {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  priority?: ProjectPriority;
};

const allowedStatuses: ReadonlyArray<ProjectStatus> = ["todo", "in_progress", "done"];
const allowedPriorities: ReadonlyArray<ProjectPriority> = ["low", "medium", "high"];

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const payload = await readBody<CreateProjectPayload>(event);
  const name = isString(payload?.name) ? trim(payload.name) : undefined;

  if (isEmpty(name)) {
    throw new HTTPError("Project name is required.", { status: 400 });
  }

  if (name && name.length > 255) {
    throw new HTTPError("Project name must be 255 characters or fewer.", { status: 400 });
  }

  const rawDesc = isString(payload?.description) ? trim(payload.description) : null;
  const description = isEmpty(rawDesc) ? null : rawDesc;

  let status: ProjectStatus | undefined;

  if (isString(payload?.status)) {
    const statusValue = payload.status as ProjectStatus;

    if (!allowedStatuses.includes(statusValue)) {
      throw new HTTPError("Invalid project status. Must be 'todo', 'in_progress', or 'done'.", {
        status: 400,
      });
    }

    status = statusValue;
  }

  let priority: ProjectPriority | undefined;

  if (isString(payload?.priority)) {
    const priorityValue = payload.priority as ProjectPriority;

    if (!allowedPriorities.includes(priorityValue)) {
      throw new HTTPError("Invalid project priority. Must be 'low', 'medium', or 'high'.", {
        status: 400,
      });
    }

    priority = priorityValue;
  }

  const db = getDb();

  try {
    const insertValues: Partial<NewProject> & {
      name: string;
      description: string | null;
      userId: string;
    } = {
      name,
      description,
      userId: context.user.id,
    };

    if (status !== undefined) {
      insertValues.status = status;
    }

    if (priority !== undefined) {
      insertValues.priority = priority;
    }

    const [newProject] = await db.insert(projects).values(insertValues).returning();

    if (!newProject) {
      throw new HTTPError("Failed to create project.", { status: 500 });
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

    throw new HTTPError("Failed to create project.", { status: 500 });
  }
});
