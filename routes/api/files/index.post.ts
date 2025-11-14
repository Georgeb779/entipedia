import { defineHandler } from "nitro/h3";
import { HTTPError, readMultipartFormData } from "h3";
import { Buffer } from "node:buffer";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getDb, files, projects } from "db";
import type { AuthUser } from "@/types";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/constants";
import { generateUniqueFilename } from "@/utils";
import { r2Client, R2_BUCKET_NAME } from "../../utils/r2-client";
import { toIsoString } from "../../_utils/dates.ts";
import { isValidUUID } from "../../_utils/uuid.ts";
import { and, eq } from "drizzle-orm";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const parts = await readMultipartFormData(event);

  if (!parts || parts.length === 0) {
    throw new HTTPError("Invalid file upload payload.", { status: 400 });
  }

  let fileEntry: { data: Uint8Array; filename?: string; type?: string; name?: string } | null =
    null;
  let descriptionEntry: string | null = null;
  let projectIdEntry: string | null = null;

  for (const part of parts) {
    if (part.name === "file" && part.data) {
      fileEntry = {
        data: part.data,
        filename: part.filename,
        type: part.type,
        name: part.name,
      };
    } else if (part.name === "description" && part.data) {
      descriptionEntry = new TextDecoder().decode(part.data);
    } else if (part.name === "projectId" && part.data) {
      projectIdEntry = new TextDecoder().decode(part.data);
    }
  }

  if (!fileEntry || !fileEntry.data) {
    throw new HTTPError("Invalid file upload payload.", { status: 400 });
  }

  const filename =
    fileEntry.filename && fileEntry.filename.length > 0 ? fileEntry.filename : "file";
  const mimeType = fileEntry.type || "application/octet-stream";

  if (!ALLOWED_FILE_TYPES.includes(mimeType)) {
    throw new HTTPError("File type not allowed.", { status: 400 });
  }

  const fileBuffer = Buffer.from(fileEntry.data);

  if (fileBuffer.byteLength === 0) {
    throw new HTTPError("Empty files are not allowed.", { status: 400 });
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new HTTPError("File size exceeds limit.", { status: 413 });
  }

  const storedFilename = generateUniqueFilename(filename);

  let projectId: string | null = null;

  if (projectIdEntry && isValidUUID(projectIdEntry)) {
    projectId = projectIdEntry;
  }

  // No local directory creation required for cloud storage.

  let description: string | null = null;

  if (descriptionEntry !== null && descriptionEntry !== undefined) {
    const trimmed = descriptionEntry.trim();

    if (trimmed.length > 2000) {
      throw new HTTPError("Description must be 2000 characters or fewer.", { status: 400 });
    }

    description = trimmed.length > 0 ? trimmed : null;
  }

  // Validate project ownership BEFORE uploading to R2 to avoid orphaned objects.
  const db = getDb();

  if (projectId) {
    const [project] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.userId, context.user.id)))
      .limit(1);

    if (!project) {
      throw new HTTPError("Project not found or access denied.", { status: 400 });
    }
  }

  try {
    const putCommand = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storedFilename,
      Body: fileBuffer,
      ContentType: mimeType,
      ContentLength: fileBuffer.byteLength,
    });
    await r2Client.send(putCommand);
  } catch (error) {
    throw new HTTPError("Failed to upload file to cloud storage.", { status: 500, cause: error });
  }

  try {
    const [newFile] = await db
      .insert(files)
      .values({
        filename,
        storedFilename,
        mimeType,
        size: fileBuffer.byteLength,
        // NOTE: During the R2 migration, `path` temporarily stores the object key.
        // A later schema update will store the full R2 URL instead.
        path: storedFilename,
        description,
        userId: context.user.id,
        projectId,
      })
      .returning();

    if (!newFile) {
      throw new HTTPError("Failed to create file record.", { status: 500 });
    }

    return {
      file: {
        ...newFile,
        createdAt: toIsoString(newFile.createdAt),
      },
    };
  } catch (error) {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: storedFilename,
    });
    await r2Client.send(deleteCommand).catch(() => undefined);
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to save file metadata.", { status: 500, cause: error });
  }
});
