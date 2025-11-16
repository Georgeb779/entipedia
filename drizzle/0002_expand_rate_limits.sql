-- Expand rate_limits to support scoped counters and higher request ceilings
ALTER TABLE "rate_limits" RENAME COLUMN "email" TO "identifier";

ALTER TABLE "rate_limits" ADD COLUMN "scope" varchar(100) NOT NULL DEFAULT 'default';
ALTER TABLE "rate_limits" ADD COLUMN "window_started_at" timestamp with time zone NOT NULL DEFAULT now();
ALTER TABLE "rate_limits" ADD COLUMN "request_count" integer NOT NULL DEFAULT 1;

-- Existing entries belong to the email verification scope and should reset their window
UPDATE "rate_limits"
SET "scope" = 'auth:resend-verification',
    "window_started_at" = "last_request_at",
    "request_count" = 1;

ALTER TABLE "rate_limits" ALTER COLUMN "scope" DROP DEFAULT;
ALTER TABLE "rate_limits" ALTER COLUMN "window_started_at" DROP DEFAULT;
ALTER TABLE "rate_limits" ALTER COLUMN "request_count" DROP DEFAULT;

ALTER TABLE "rate_limits" DROP CONSTRAINT IF EXISTS "rate_limits_email_unique";
CREATE UNIQUE INDEX IF NOT EXISTS "rate_limits_identifier_scope_unique" ON "rate_limits" ("identifier", "scope");
