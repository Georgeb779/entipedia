import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError } from "h3";
import { and, eq } from "drizzle-orm";
import { promises as fs } from "node:fs";
import { join } from "node:path";

import { getDb, files } from "db";
import type { AuthUser } from "@/types";
import { isValidUUID } from "../../_utils/uuid.ts";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const fileId = idParam;

  if (!isValidUUID(fileId)) {
    throw new HTTPError("Invalid file id.", { statusCode: 400 });
  }

  const db = getDb();

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, context.user.id)))
    .limit(1);

  if (!file) {
    throw new HTTPError("File not found or access denied.", { statusCode: 404 });
  }

  const uploadsDir = join(process.cwd(), "uploads");
  const filePath = join(uploadsDir, file.storedFilename);

  try {
    await fs.unlink(filePath);
  } catch (error) {
    const code = (error as NodeJS.ErrnoException | null)?.code;

    if (code && code !== "ENOENT") {
      throw new HTTPError("Failed to delete file from disk.", { statusCode: 500, cause: error });
    }
  }

  await db.delete(files).where(and(eq(files.id, fileId), eq(files.userId, context.user.id)));

  return {
    success: true,
    message: "File deleted successfully.",
  };
});
