import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { desc, eq } from "drizzle-orm";

import { getDb, files } from "db";
import type { AuthUser } from "@/types";
import { toIsoString } from "../../_utils/dates.ts";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const db = getDb();

  try {
    const userFiles = await db
      .select()
      .from(files)
      .where(eq(files.userId, context.user.id))
      .orderBy(desc(files.createdAt));

    const serializedFiles = userFiles.map((file) => ({
      ...file,
      createdAt: toIsoString(file.createdAt),
    }));

    return { files: serializedFiles };
  } catch (error) {
    throw new HTTPError("Failed to fetch files.", { statusCode: 500, cause: error });
  }
});
