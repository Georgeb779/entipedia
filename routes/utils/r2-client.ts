import { S3Client } from "@aws-sdk/client-s3";

// Cloudflare R2 configuration is S3 compatible.
// We validate required environment variables early to surface misconfiguration fast.

const accountId = process.env.R2_ACCOUNT_ID;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;

if (!accountId) {
  throw new Error("Missing R2_ACCOUNT_ID environment variable.");
}
if (!accessKeyId) {
  throw new Error("Missing R2_ACCESS_KEY_ID environment variable.");
}
if (!secretAccessKey) {
  throw new Error("Missing R2_SECRET_ACCESS_KEY environment variable.");
}
if (!R2_BUCKET_NAME) {
  throw new Error("Missing R2_BUCKET_NAME environment variable.");
}

// Endpoint pattern: https://{accountId}.r2.cloudflarestorage.com
// Region is set to 'auto' per Cloudflare's guidance.
export const r2Client = new S3Client({
  region: "auto",
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
  forcePathStyle: true,
});

export type R2ObjectKey = string;
