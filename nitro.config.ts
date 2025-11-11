import { fileURLToPath } from "node:url";

import { defineNitroConfig } from "nitro/config";

const srcAliasPath = fileURLToPath(new URL("./src", import.meta.url));
const dbAliasPath = fileURLToPath(new URL("./db/index.ts", import.meta.url));

export default defineNitroConfig({
  compatibilityDate: "2025-11-01",
  serverDir: ".",
  logLevel: 3,
  alias: {
    "@": srcAliasPath,
    db: dbAliasPath,
  },
  typescript: {
    tsConfig: {
      extends: "./tsconfig.json",
    },
  },
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
  },
});
