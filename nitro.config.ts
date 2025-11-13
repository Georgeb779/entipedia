import { fileURLToPath } from "node:url";

import { defineNitroConfig } from "nitro/config";
import type { NitroConfig } from "nitro/types";

const srcAliasPath = fileURLToPath(new URL("./src", import.meta.url));
const dbAliasPath = fileURLToPath(new URL("./db/index.ts", import.meta.url));

const resolvedPort = Number(process.env.PORT ?? process.env.NITRO_PORT ?? 3000);
const resolvedHost = process.env.HOST ?? process.env.NITRO_HOST ?? "0.0.0.0";

export default defineNitroConfig({
  compatibilityDate: "2025-11-01",
  serverDir: ".",
  logLevel: 3,
  port: resolvedPort,
  host: resolvedHost,
  renderer: undefined,
  experimental: {
    openAPI: true,
  },
  alias: {
    "@": srcAliasPath,
    db: dbAliasPath,
  },
  prerender: {
    autoSubfolderIndex: false,
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
} as NitroConfig & { port: number; host: string });
