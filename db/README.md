# Database

## Overview

This directory contains the PostgreSQL integration for the Nitro application using Drizzle ORM. It centralizes schema definitions, connection utilities, and workflow documentation so database changes stay consistent across environments.

## File Structure

- `schema.ts`: Declares all tables, enums, and strongly typed models with Drizzle ORM.
- `index.ts`: Creates the postgres.js connection pool and exports the Drizzle instance for queries.
- `../drizzle.config.ts`: Defines Drizzle Kit settings for migrations and schema introspection.

## Database Schema

Drizzle models define four core tables and an enum:

- `users`: Stores account credentials and profile data.
- `projects`: Represents project workspaces owned by users.
- `tasks`: Tracks actionable items linked to users and optionally projects. Uses the `taskStatus` enum (`todo`, `in_progress`, `done`).
- `files`: Records uploaded assets associated with users and optionally projects.

Relationships:

- Users own projects, tasks, and files (cascade delete on owner removal).
- Tasks may belong to a project; deleting a project cascades to its tasks.
- Files may belong to a project; deleting a project cascades to its files.

## Setup Instructions

1. Copy `.env.example` to `.env` in the project root.
2. Update the `DATABASE_URL` value with your PostgreSQL credentials.
3. Start a local PostgreSQL instance or ensure remote access.
4. Run `npm run db:push` for a quick bootstrap during development **or**:
   - `npm run db:generate` to create a migration snapshot.
   - `npm run db:migrate` to apply migrations to your database.

## Development Workflow

- Modify `schema.ts` whenever tables or columns change.
- Run `npm run db:generate` to produce SQL artifacts in the `drizzle/` directory.
- Review generated SQL before committing (the directory is ignored by default; add files if your team commits migrations).
- Execute `npm run db:migrate` to sync your database with the latest schema.

## Usage Examples

Import the shared Drizzle instance in API handlers to run queries. For example, in `routes/api/users/index.get.ts` you can:

```ts
import { getDb, users } from "db";

const db = getDb();
const data = await db.select().from(users);
```

Use the exported insert types (`NewUser`, `NewTask`, etc.) to keep mutations type-safe.

## Drizzle Studio

Use `npm run db:studio` to launch Drizzle Studio, an in-browser GUI for inspecting tables, editing rows, and running adhoc queries during development.

## Production Considerations

- Set `DATABASE_URL` as an environment variable in your hosting provider (e.g., Netlify dashboard).
- Enable TLS by appending `?ssl=true` to the connection string when your provider requires it (the driver also respects `?sslmode=require`).
- Include database migration steps (`npm run db:migrate`) in your deployment pipeline to keep environments in sync.
