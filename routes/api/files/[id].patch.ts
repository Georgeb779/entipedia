import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, readBody } from "h3";
import { and, eq } from "drizzle-orm";

import { getDb, files, projects } from "db";
import type { AuthUser } from "@/types";
import { isValidUUID } from "../../_utils/uuid.ts";
import { toIsoString } from "../../_utils/dates.ts";

type UpdateFilePayload = {
  description?: unknown;
  projectId?: unknown;
};

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const fileId = idParam;

  if (!isValidUUID(fileId)) {
    throw new HTTPError("Invalid file id.", { status: 400 });
  }

  const db = getDb();

  // Ensure file belongs to the authenticated user
  const [existing] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, context.user.id)))
    .limit(1);

  if (!existing) {
    throw new HTTPError("File not found or access denied.", { status: 404 });
  }

  const payload = (await readBody<UpdateFilePayload>(event)) ?? {};

  // Validate and normalize description
  let nextDescription: string | null | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(payload, "description")) {
    const desc = payload.description;
    if (desc === null) {
      nextDescription = null;
    } else if (typeof desc === "string") {
      const trimmed = desc.trim();
      if (trimmed.length > 2000) {
        throw new HTTPError("Description must be 2000 characters or fewer.", { status: 400 });
      }
      nextDescription = trimmed.length > 0 ? trimmed : null;
    } else {
      throw new HTTPError("Description must be a string or null.", { status: 400 });
    }
  }

  // Validate projectId when provided
  let nextProjectId: string | null | undefined = undefined;
  if (Object.prototype.hasOwnProperty.call(payload, "projectId")) {
    const proj = payload.projectId;
    if (proj === null || proj === "none" || proj === "all") {
      nextProjectId = null;
    } else if (typeof proj === "string" && isValidUUID(proj)) {
      nextProjectId = proj;

      // Verify project ownership
      const [project] = await db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, proj), eq(projects.userId, context.user.id)))
        .limit(1);

      if (!project) {
        throw new HTTPError("Project not found or access denied.", { status: 400 });
      }
    } else {
      throw new HTTPError("Invalid project id.", { status: 400 });
    }
  }

  if (nextDescription === undefined && nextProjectId === undefined) {
    throw new HTTPError("No valid fields to update.", { status: 400 });
  }

  const updateValues: { description?: string | null; projectId?: string | null } = {};
  if (nextDescription !== undefined) {
    updateValues.description = nextDescription;
  }
  if (nextProjectId !== undefined) {
    updateValues.projectId = nextProjectId;
  }

  try {
    const [updated] = await db
      .update(files)
      .set(updateValues)
      .where(and(eq(files.id, fileId), eq(files.userId, context.user.id)))
      .returning();

    if (!updated) {
      throw new HTTPError("Failed to update file.", { status: 500 });
    }

    return {
      file: {
        ...updated,
        createdAt: toIsoString(updated.createdAt),
      },
    };
  } catch (error) {
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError("Failed to update file.", { status: 500, cause: error });
  }
});
