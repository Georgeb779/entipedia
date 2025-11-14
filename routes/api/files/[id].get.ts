import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, sendStream, setHeader } from "h3";
import { and, eq } from "drizzle-orm";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "node:stream";
import { ReadableStream as NodeReadableStream } from "node:stream/web";

import { getDb, files } from "db";
import type { AuthUser } from "@/types";
import { isValidUUID } from "../../_utils/uuid.ts";
import { r2Client, R2_BUCKET_NAME } from "../../utils/r2-client";

function normalizeToWebStream(body: unknown): ReadableStream<Uint8Array> {
  if (body instanceof NodeReadableStream) {
    return body as unknown as ReadableStream<Uint8Array>;
  }

  if (body instanceof Readable) {
    const webStream = Readable.toWeb(body) as NodeReadableStream;
    return webStream as unknown as ReadableStream<Uint8Array>;
  }

  if (body instanceof Uint8Array || typeof body === "string") {
    const nodeReadable = Readable.from([body]);
    const webStream = Readable.toWeb(nodeReadable) as NodeReadableStream;
    return webStream as unknown as ReadableStream<Uint8Array>;
  }

  if (typeof (body as { pipe?: unknown })?.pipe === "function") {
    const nodeReadable = body as Readable;
    const webStream = Readable.toWeb(nodeReadable) as NodeReadableStream;
    return webStream as unknown as ReadableStream<Uint8Array>;
  }

  if (
    typeof (body as { [Symbol.asyncIterator]?: unknown })?.[Symbol.asyncIterator] === "function"
  ) {
    const nodeReadable = Readable.from(body as AsyncIterable<Uint8Array>);
    const webStream = Readable.toWeb(nodeReadable) as NodeReadableStream;
    return webStream as unknown as ReadableStream<Uint8Array>;
  }

  throw new HTTPError("Unsupported stream type from cloud storage.", { status: 500 });
}

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

    const webStream = normalizeToWebStream(body);

    return sendStream(event, webStream);
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
