import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, sendStream, setHeader } from "h3";
import { and, eq } from "drizzle-orm";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import type { Readable } from "node:stream";

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

  setHeader(event, "Content-Type", file.mimeType);
  setHeader(event, "Content-Disposition", `attachment; filename="${file.filename}"`);
  setHeader(event, "Content-Length", file.size.toString());

  try {
    const getCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: file.storedFilename,
    });
    const result = await r2Client.send(getCommand);
    const body = result.Body;

    if (!body) {
      throw new HTTPError("Failed to retrieve file from cloud storage.", { status: 500 });
    }

    // Convert Node.js Readable to ReadableStream if needed
    if (body instanceof Readable) {
      return sendStream(event, body);
    }

    // If it's already a ReadableStream, use it directly
    return sendStream(event, body as ReadableStream);
  } catch (error) {
    const name = (error as { name?: string } | null)?.name;
    const status = (error as { $metadata?: { httpStatusCode?: number } } | null)?.$metadata
      ?.httpStatusCode;
    if (name === "NoSuchKey" || name === "NotFound" || status === 404) {
      throw new HTTPError("File not found in cloud storage.", { status: 404 });
    }
    if (error instanceof HTTPError) {
      throw error;
    }
    throw new HTTPError("Failed to download file from cloud storage.", {
      status: 500,
      cause: error,
    });
  }
});
