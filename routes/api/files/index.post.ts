import { defineHandler } from "nitro/h3";
import { HTTPError, readFormData } from "h3";
import { join } from "node:path";
import { promises as fs } from "node:fs";
import { Buffer } from "node:buffer";

import { getDb, files, projects } from "db";
import type { AuthUser } from "@/types";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/constants";
import { generateUniqueFilename } from "@/utils";
import { toIsoString } from "../../_utils/dates.ts";
import { isValidUUID } from "../../_utils/uuid.ts";
import { and, eq } from "drizzle-orm";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  const form = await readFormData(event);
  const fileEntry = form.get("file");
  const descriptionEntry = form.get("description");

  if (!fileEntry || !(fileEntry instanceof Blob) || !("name" in fileEntry)) {
    throw new HTTPError("Invalid file upload payload.", { status: 400 });
  }

  const file = fileEntry as Blob & { name?: string };
  const filename = typeof file.name === "string" && file.name.length > 0 ? file.name : "file";

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new HTTPError("File type not allowed.", { status: 400 });
  }

  const fileBuffer = Buffer.from(await file.arrayBuffer());

  if (fileBuffer.byteLength === 0) {
    throw new HTTPError("Empty files are not allowed.", { status: 400 });
  }

  if (fileBuffer.byteLength > MAX_FILE_SIZE) {
    throw new HTTPError("File size exceeds limit.", { status: 413 });
  }

  const uploadsDir = join(process.cwd(), "uploads");
  const storedFilename = generateUniqueFilename(filename);
  const filePath = join(uploadsDir, storedFilename);
  const relativePath = `uploads/${storedFilename}`;

  let projectId: string | null = null;
  const projectIdEntry = form.get("projectId");

  if (typeof projectIdEntry === "string" && isValidUUID(projectIdEntry)) {
    projectId = projectIdEntry;
  }

  await fs.mkdir(uploadsDir, { recursive: true });

  let description: string | null = null;

  if (descriptionEntry !== null && descriptionEntry !== undefined) {
    if (typeof descriptionEntry !== "string") {
      throw new HTTPError("Description must be a string.", { status: 400 });
    }

    const trimmed = descriptionEntry.trim();

    if (trimmed.length > 2000) {
      throw new HTTPError("Description must be 2000 characters or fewer.", { status: 400 });
    }

    description = trimmed.length > 0 ? trimmed : null;
  }

  try {
    await fs.writeFile(filePath, fileBuffer);
  } catch (error) {
    throw new HTTPError("Failed to save file.", { status: 500, cause: error });
  }

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
    const [newFile] = await db
      .insert(files)
      .values({
        filename,
        storedFilename,
        mimeType: file.type,
        size: fileBuffer.byteLength,
        path: relativePath,
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
    await fs.unlink(filePath).catch(() => undefined);
    if (error instanceof HTTPError) {
      throw error;
    }

    throw new HTTPError("Failed to save file metadata.", { status: 500, cause: error });
  }
});
