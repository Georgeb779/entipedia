import { defineHandler, getQuery } from "nitro/h3";
import { HTTPError } from "h3";
import { and, desc, eq } from "drizzle-orm";
import { isString, isEmpty } from "lodash";

import { getDb, files } from "db";
import type { AuthUser } from "@/types";
import { ALLOWED_FILE_TYPES } from "@/constants";
import { toIsoString } from "../../_utils/dates.ts";
import { isValidUUID } from "../../_utils/uuid.ts";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { statusCode: 401 });
  }

  const db = getDb();

  const query = getQuery(event);
  const projectIdParam = Array.isArray(query.projectId) ? query.projectId[0] : query.projectId;
  let projectIdFilter: string | null = null;

  if (isString(projectIdParam) && !isEmpty(projectIdParam) && projectIdParam !== "all") {
    if (!isValidUUID(projectIdParam)) {
      throw new HTTPError("Invalid project filter.", { statusCode: 400 });
    }

    projectIdFilter = projectIdParam;
  }

  const mimeTypeParam = Array.isArray(query.mimeType) ? query.mimeType[0] : query.mimeType;
  let mimeTypeFilter: string | null = null;

  if (isString(mimeTypeParam) && !isEmpty(mimeTypeParam) && mimeTypeParam !== "all") {
    if (!ALLOWED_FILE_TYPES.includes(mimeTypeParam)) {
      throw new HTTPError("Unsupported file type filter.", { statusCode: 400 });
    }

    mimeTypeFilter = mimeTypeParam;
  }

  const conditions = [eq(files.userId, context.user.id)];

  if (projectIdFilter !== null) {
    conditions.push(eq(files.projectId, projectIdFilter));
  }

  if (mimeTypeFilter !== null) {
    conditions.push(eq(files.mimeType, mimeTypeFilter));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  try {
    const userFiles = await db
      .select()
      .from(files)
      .where(whereClause)
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
