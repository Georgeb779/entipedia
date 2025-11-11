import { defineHandler } from "nitro/h3";
import { HTTPError, readBody } from "h3";

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

  const rawDesc = typeof payload?.description === "string" ? payload.description.trim() : null;
  const description = rawDesc ? rawDesc : null;

  let status: ProjectStatus | undefined;

  if (typeof payload?.status === "string") {
    const statusValue = payload.status as ProjectStatus;

    if (!allowedStatuses.includes(statusValue)) {
      throw new HTTPError("Invalid project status. Must be 'todo', 'in_progress', or 'done'.", {
        statusCode: 400,
      });
    }

    status = statusValue;
  }

  let priority: ProjectPriority | undefined;

  if (typeof payload?.priority === "string") {
    const priorityValue = payload.priority as ProjectPriority;

    if (!allowedPriorities.includes(priorityValue)) {
      throw new HTTPError("Invalid project priority. Must be 'low', 'medium', or 'high'.", {
        statusCode: 400,
      });
    }

    priority = priorityValue;
  }

  const db = getDb();

  try {
    const insertValues: Partial<NewProject> & {
      name: string;
      description: string | null;
      userId: number;
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
