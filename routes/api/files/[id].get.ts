import { defineHandler, getRouterParam } from "nitro/h3";
import { HTTPError, sendStream, setHeader } from "h3";
import { and, eq } from "drizzle-orm";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import { join } from "node:path";
import { Buffer } from "node:buffer";

import { getDb, files } from "db";
import type { AuthUser } from "@/types";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const idParam = getRouterParam(event, "id");
  const fileId = Number.parseInt(idParam ?? "", 10);

  if (!Number.isInteger(fileId) || fileId <= 0) {
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
    await fs.access(filePath);
  } catch {
    throw new HTTPError("File not found on disk.", { statusCode: 404 });
  }

  setHeader(event, "Content-Type", file.mimeType);
  setHeader(event, "Content-Disposition", `attachment; filename="${file.filename}"`);
  setHeader(event, "Content-Length", file.size.toString());

  const stream = createReadStream(filePath);

  const webStream = new ReadableStream<Uint8Array>({
    start(controller) {
      stream.on("data", (chunk: string | Buffer) => {
        const bufferChunk = typeof chunk === "string" ? Buffer.from(chunk) : chunk;
        controller.enqueue(
          new Uint8Array(bufferChunk.buffer, bufferChunk.byteOffset, bufferChunk.byteLength),
        );
      });
      stream.once("end", () => {
        controller.close();
      });
      stream.once("error", (error) => {
        controller.error(error);
      });
    },
    cancel() {
      stream.destroy();
    },
  });

  return sendStream(event, webStream);
});
