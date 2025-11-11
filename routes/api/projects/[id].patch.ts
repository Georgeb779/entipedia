import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, projects } from "db";
import type { NewProject } from "db/schema";
import type { AuthUser, ProjectPriority, ProjectStatus } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";

type UpdateProjectPayload = {
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

  const idParam = getRouterParam(event, "id");
  const projectId = Number.parseInt(idParam ?? "", 10);

  if (!Number.isInteger(projectId) || projectId <= 0) {
    throw new HTTPError("Invalid project id.", { statusCode: 400 });
  }

  const payload = await readBody<UpdateProjectPayload>(event);
  const updateData: Partial<NewProject> = {};

  if (typeof payload?.name === "string") {
    const trimmed = payload.name.trim();

    if (!trimmed) {
      throw new HTTPError("Project name is required when provided.", { statusCode: 400 });
    }

    if (trimmed.length > 255) {
      throw new HTTPError("Project name must be 255 characters or fewer.", { statusCode: 400 });
    }

    updateData.name = trimmed;
  }

  if (payload?.description !== undefined) {
    if (payload.description === null) {
      updateData.description = null;
    } else if (typeof payload.description === "string") {
      const rawDesc = payload.description.trim();
      updateData.description = rawDesc ? rawDesc : null;
    } else {
      throw new HTTPError("Description must be a string or null.", { statusCode: 400 });
    }
  }

  if (typeof payload?.status === "string") {
    const statusValue = payload.status as ProjectStatus;

    if (!allowedStatuses.includes(statusValue)) {
      throw new HTTPError("Invalid project status. Must be 'todo', 'in_progress', or 'done'.", {
        statusCode: 400,
      });
    }

    updateData.status = statusValue;
  }

  if (typeof payload?.priority === "string") {
    const priorityValue = payload.priority as ProjectPriority;

    if (!allowedPriorities.includes(priorityValue)) {
      throw new HTTPError("Invalid project priority. Must be 'low', 'medium', or 'high'.", {
        statusCode: 400,
      });
    }

    updateData.priority = priorityValue;
  }

  if (Object.keys(updateData).length === 0) {
    throw new HTTPError("No valid fields provided for update.", { statusCode: 400 });
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

    const [updatedProject] = await db
      .update(projects)
      .set(updateData)
      .where(and(eq(projects.id, projectId), eq(projects.userId, context.user.id)))
      .returning();

    if (!updatedProject) {
      throw new HTTPError("Failed to update project.", { statusCode: 500 });
    }

    return {
      project: {
        ...updatedProject,
        createdAt: toIsoString(updatedProject.createdAt),
        updatedAt: toIsoString(updatedProject.updatedAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to update project.", { statusCode: 500 });
  }
});
