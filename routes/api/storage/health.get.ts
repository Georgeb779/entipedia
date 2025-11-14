import { defineHandler } from "nitro/h3";
import { HTTPError } from "h3";
import { HeadBucketCommand } from "@aws-sdk/client-s3";
import { r2Client, R2_BUCKET_NAME } from "../../utils/r2-client";
import type { AuthUser } from "@/types";

export default defineHandler(async (event) => {
  const context = event.context as { user: AuthUser | null };

  if (!context.user) {
    throw new HTTPError("Authentication required.", { status: 401 });
  }

  try {
    const cmd = new HeadBucketCommand({ Bucket: R2_BUCKET_NAME });
    await r2Client.send(cmd);
    return { ok: true, bucket: R2_BUCKET_NAME };
  } catch (error) {
    const name = (error as { name?: string } | null)?.name ?? "UnknownError";
    throw new HTTPError("Cloud storage health check failed.", {
      status: 500,
      cause: { name },
    });
  }
});
