-- Migration to convert all integer IDs to UUIDs
-- This migration handles existing data by generating new UUIDs

-- Step 1: Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Step 2: Add temporary UUID columns for users
ALTER TABLE "users" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
UPDATE "users" SET "id_new" = gen_random_uuid();

-- Step 3: Create a mapping table to track old ID -> new UUID for users
CREATE TEMP TABLE user_id_mapping AS
SELECT "id" as old_id, "id_new" as new_id FROM "users";

-- Step 4: Add temporary UUID columns for projects
ALTER TABLE "projects" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "projects" ADD COLUMN "user_id_new" uuid;

-- Step 5: Update projects with new UUIDs and mapped user_id
UPDATE "projects" SET "id_new" = gen_random_uuid();
UPDATE "projects" p
SET "user_id_new" = m.new_id
FROM user_id_mapping m
WHERE p."user_id" = m.old_id;

-- Step 6: Create mapping table for projects
CREATE TEMP TABLE project_id_mapping AS
SELECT "id" as old_id, "id_new" as new_id FROM "projects";

-- Step 7: Add temporary UUID columns for tasks
ALTER TABLE "tasks" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "tasks" ADD COLUMN "user_id_new" uuid;
ALTER TABLE "tasks" ADD COLUMN "project_id_new" uuid;

-- Step 8: Update tasks with new UUIDs and mapped foreign keys
UPDATE "tasks" SET "id_new" = gen_random_uuid();
UPDATE "tasks" t
SET "user_id_new" = m.new_id
FROM user_id_mapping m
WHERE t."user_id" = m.old_id;

UPDATE "tasks" t
SET "project_id_new" = m.new_id
FROM project_id_mapping m
WHERE t."project_id" = m.old_id;

-- Step 9: Add temporary UUID columns for files
ALTER TABLE "files" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "files" ADD COLUMN "user_id_new" uuid;
ALTER TABLE "files" ADD COLUMN "project_id_new" uuid;

-- Step 10: Update files with new UUIDs and mapped foreign keys
UPDATE "files" SET "id_new" = gen_random_uuid();
UPDATE "files" f
SET "user_id_new" = m.new_id
FROM user_id_mapping m
WHERE f."user_id" = m.old_id;

UPDATE "files" f
SET "project_id_new" = m.new_id
FROM project_id_mapping m
WHERE f."project_id" = m.old_id;

-- Step 11: Add temporary UUID columns for clients
ALTER TABLE "clients" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "clients" ADD COLUMN "user_id_new" uuid;

-- Step 12: Update clients with new UUIDs and mapped foreign keys
UPDATE "clients" SET "id_new" = gen_random_uuid();
UPDATE "clients" c
SET "user_id_new" = m.new_id
FROM user_id_mapping m
WHERE c."user_id" = m.old_id;

-- Step 13: Drop all foreign key constraints
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_user_id_users_id_fk";
ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_user_id_users_id_fk";
ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_project_id_projects_id_fk";
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_user_id_users_id_fk";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_user_id_users_id_fk";
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_project_id_projects_id_fk";

-- Step 14: Drop old integer columns and rename new UUID columns
-- Users
ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_pkey";
ALTER TABLE "users" DROP COLUMN "id";
ALTER TABLE "users" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "users" ADD PRIMARY KEY ("id");

-- Projects
ALTER TABLE "projects" DROP CONSTRAINT IF EXISTS "projects_pkey";
ALTER TABLE "projects" DROP COLUMN "id";
ALTER TABLE "projects" DROP COLUMN "user_id";
ALTER TABLE "projects" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "projects" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "projects" ADD PRIMARY KEY ("id");
ALTER TABLE "projects" ALTER COLUMN "user_id" SET NOT NULL;

-- Tasks
ALTER TABLE "tasks" DROP CONSTRAINT IF EXISTS "tasks_pkey";
ALTER TABLE "tasks" DROP COLUMN "id";
ALTER TABLE "tasks" DROP COLUMN "user_id";
ALTER TABLE "tasks" DROP COLUMN "project_id";
ALTER TABLE "tasks" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "tasks" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "tasks" RENAME COLUMN "project_id_new" TO "project_id";
ALTER TABLE "tasks" ADD PRIMARY KEY ("id");
ALTER TABLE "tasks" ALTER COLUMN "user_id" SET NOT NULL;

-- Files
ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "files_pkey";
ALTER TABLE "files" DROP COLUMN "id";
ALTER TABLE "files" DROP COLUMN "user_id";
ALTER TABLE "files" DROP COLUMN "project_id";
ALTER TABLE "files" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "files" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "files" RENAME COLUMN "project_id_new" TO "project_id";
ALTER TABLE "files" ADD PRIMARY KEY ("id");
ALTER TABLE "files" ALTER COLUMN "user_id" SET NOT NULL;

-- Clients
ALTER TABLE "clients" DROP CONSTRAINT IF EXISTS "clients_pkey";
ALTER TABLE "clients" DROP COLUMN "id";
ALTER TABLE "clients" DROP COLUMN "user_id";
ALTER TABLE "clients" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "clients" RENAME COLUMN "user_id_new" TO "user_id";
ALTER TABLE "clients" ADD PRIMARY KEY ("id");
ALTER TABLE "clients" ALTER COLUMN "user_id" SET NOT NULL;

-- Step 15: Recreate foreign key constraints
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "files" ADD CONSTRAINT "files_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "files" ADD CONSTRAINT "files_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;

-- Step 16: Set default values for future inserts
ALTER TABLE "users" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "projects" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "tasks" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "files" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();
ALTER TABLE "clients" ALTER COLUMN "id" SET DEFAULT gen_random_uuid();

