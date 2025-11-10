/**
 * Lazily creates a postgres.js connection pool and Drizzle ORM instance.
 * Call `getDb()` when you need the database; it throws a descriptive error if `DATABASE_URL` is missing.
 */
import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import * as schema from "./schema";

let sqlInstance: ReturnType<typeof postgres> | null = null;
let dbInstance: PostgresJsDatabase<typeof schema> | null = null;

const createSqlClient = (connectionString: string) => {
  const url = new URL(connectionString);
  const sslParam = url.searchParams.get("ssl");
  const sslMode = url.searchParams.get("sslmode");

  const sslEnabled =
    (sslParam && sslParam.toLowerCase() !== "false" && sslParam !== "0") ||
    (sslMode && sslMode.toLowerCase() === "require");

  return postgres(connectionString, {
    max: 10,
    idle_timeout: 20,
    connect_timeout: 10,
    prepare: false,
    ...(sslEnabled ? { ssl: true } : {}),
  });
};

export const getSql = () => {
  if (!sqlInstance) {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
      throw new Error(
        "DATABASE_URL environment variable is not set. Update your .env file with a valid connection string.",
      );
    }

    sqlInstance = createSqlClient(connectionString);
  }

  return sqlInstance;
};

export const getDb = () => {
  if (!dbInstance) {
    dbInstance = drizzle(getSql(), { schema });
  }

  return dbInstance;
};

export * from "./schema";
