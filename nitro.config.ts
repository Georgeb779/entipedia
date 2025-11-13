import inject from "@rollup/plugin-inject";
import { fileURLToPath } from "node:url";
import type { Plugin as RollupPlugin } from "rollup";

import { defineNitroConfig } from "nitro/config";
import type { Nitro, NitroConfig, RollupConfig } from "nitro/types";

const srcAliasPath = fileURLToPath(new URL("./src", import.meta.url));
const dbAliasPath = fileURLToPath(new URL("./db/index.ts", import.meta.url));

const resolvedPort = Number(process.env.PORT ?? process.env.NITRO_PORT ?? 3000);
const resolvedHost = process.env.HOST ?? process.env.NITRO_HOST ?? "0.0.0.0";

const injectGuardMarker = "__nitroInjectGuarded__";

const isInjectPlugin = (plugin: RollupPlugin): boolean => plugin.name === "inject";

const shouldTransformId = (id: string | undefined): boolean => {
  if (!id) {
    return false;
  }
  if (id.includes("?")) {
    return false;
  }
  return /\.(?:mjs|cjs|js)$/i.test(id);
};

type MutableRollupPlugin = RollupPlugin & {
  transform?: RollupPlugin["transform"];
  [injectGuardMarker]?: boolean;
};

const guardInjectPlugin = (plugin: MutableRollupPlugin): void => {
  if (plugin[injectGuardMarker]) {
    return;
  }
  plugin[injectGuardMarker] = true;

  const transform = plugin.transform;
  if (typeof transform !== "function") {
    return;
  }

  plugin.transform = function transformGuard(this, code, id, ...rest) {
    if (!shouldTransformId(typeof id === "string" ? id : undefined)) {
      return null;
    }
    return transform.call(this, code, id, ...rest);
  } as RollupPlugin["transform"];
};

const traversePlugins = (entry: unknown): void => {
  if (!entry) {
    return;
  }

  if (Array.isArray(entry)) {
    entry.forEach(traversePlugins);
    return;
  }

  if (typeof entry !== "object") {
    return;
  }

  const plugin = entry as MutableRollupPlugin;
  if (isInjectPlugin(plugin)) {
    guardInjectPlugin(plugin);
  }
};

const isProd = process.env.NODE_ENV === "production";

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
  publicAssets: isProd
    ? [
        {
          dir: "dist",
          baseURL: "/",
          fallthrough: false,
        },
      ]
    : [],
  runtimeConfig: {
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
  },
  rollupConfig: {
    plugins: [
      inject({
        include: ["**/*.js", "**/*.mjs", "**/*.cjs"],
      }),
    ],
  },
  hooks: {
    "rollup:before"(_nitro: Nitro, rollupConfig: RollupConfig) {
      if (!rollupConfig.plugins) {
        return;
      }
      traversePlugins(rollupConfig.plugins);
    },
  },
} as NitroConfig & { port: number; host: string });
