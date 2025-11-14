import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError } from "h3";
import { and, eq } from "drizzle-orm";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";

import { getDb, files } from "db";
import type { AuthUser } from "@/types";
import { isValidUUID } from "../../_utils/uuid.ts";
import { r2Client, R2_BUCKET_NAME } from "../../utils/r2-client";

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

  const [file] = await db
    .select()
    .from(files)
    .where(and(eq(files.id, fileId), eq(files.userId, context.user.id)))
    .limit(1);

  if (!file) {
    throw new HTTPError("File not found or access denied.", { status: 404 });
  }

  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.storedFilename,
    });
    await r2Client.send(deleteCommand);
  } catch (error) {
    throw new HTTPError("Failed to delete file from cloud storage.", { status: 500, cause: error });
  }

  await db.delete(files).where(and(eq(files.id, fileId), eq(files.userId, context.user.id)));

  return {
    success: true,
    message: "File deleted successfully.",
  };
});
