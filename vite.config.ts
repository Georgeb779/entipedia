import { nitro } from "nitro/vite";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig, type Plugin, type PluginOption } from "vite";

// vite plugins
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import Fonts from "unplugin-fonts/vite";
import Inspect from "vite-plugin-inspect";
import Pages from "vite-plugin-pages";
import svgr from "vite-plugin-svgr";

import { fonts } from "./configs/fonts.config";

function GuardAutoImportPlugin(plugin: PluginOption): PluginOption {
  if (plugin && typeof plugin === "object" && !Array.isArray(plugin) && !("then" in plugin)) {
    const rollupPlugin = plugin as Plugin;
    const originalApply = rollupPlugin.apply;
    return {
      ...rollupPlugin,
      apply(config, applyEnv) {
        const ssrFlag =
          (applyEnv as { ssrBuild?: boolean }).ssrBuild ?? applyEnv.isSsrBuild ?? false;
        if (ssrFlag) {
          return false;
        }
        if (typeof originalApply === "function") {
          return originalApply(config, applyEnv);
        }
        if (originalApply === "build") {
          return applyEnv.command === "build";
        }
        if (originalApply === "serve") {
          return applyEnv.command === "serve";
        }
        if (typeof originalApply === "undefined") {
          return true;
        }
        return originalApply;
      },
    } satisfies PluginOption;
  }
  return plugin;
}

const useProxy = process.env.VITE_USE_PROXY === "true";

const basePlugins: PluginOption[] = [
  react(),
  Pages({
    dirs: "src/pages",
    extensions: ["tsx", "jsx"],
    importMode: "sync",
    exclude: ["**/*-schema.ts", "**/*-utils.ts", "**/*-card.tsx", "**/*-modals.tsx"],
  }),
  svgr(),
  Inspect(),
  // ViteImagemin() - commented out due to type issues, uncomment if needed
  tailwindcss(),
  Fonts({ google: { families: fonts } }),
];

const autoImportPlugin = AutoImport({
  imports: ["react", "react-router"],
  dts: "./auto-imports.d.ts",
  eslintrc: {
    enabled: true,
    // filepath: "./eslint.config.js",
  },
  viteOptimizeDeps: true,
  include: [/src\/.*\.(?:t|j)sx$/],
  exclude: ["**/*.ts", "**/routes/**", "**/middleware/**", "**/server.ts", "**/db/**"],
  // uncomment if you want to auto import ui components
  // dirs: ['./src/components/ui'],
});

const guardedAutoImportPlugins = (
  Array.isArray(autoImportPlugin) ? autoImportPlugin : [autoImportPlugin]
).map(GuardAutoImportPlugin);

const plugins: PluginOption[] = [...basePlugins, ...guardedAutoImportPlugins];

if (!useProxy && process.env.NODE_ENV !== "production") {
  plugins.unshift(nitro());
}

export default defineConfig({
  base: "/",
  appType: "spa",
  server: {
    port: 5000,
    ...(useProxy
      ? {
          proxy: {
            "/api": {
              target: "http://localhost:5999",
              changeOrigin: true,
              secure: false,
            },
          },
        }
      : {}),
  },

  plugins,

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
