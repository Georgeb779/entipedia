import { nitro } from "nitro/vite";
import path from "path";
import AutoImport from "unplugin-auto-import/vite";
import { defineConfig, type PluginOption } from "vite";

// vite plugins
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import Fonts from "unplugin-fonts/vite";
import Inspect from "vite-plugin-inspect";
import Pages from "vite-plugin-pages";
import svgr from "vite-plugin-svgr";

import { fonts } from "./configs/fonts.config";

const useProxy = process.env.VITE_USE_PROXY === "true";

const plugins: PluginOption[] = [
  react(),
  Pages({
    dirs: "src/pages",
    extensions: ["tsx", "jsx"],
    importMode: "sync",
  }),
  svgr(),

  Inspect(),
  // ViteImagemin() - commented out due to type issues, uncomment if needed
  tailwindcss(),
  Fonts({ google: { families: fonts } }),
  AutoImport({
    imports: ["react", "react-router"],
    dts: "./auto-imports.d.ts",
    eslintrc: {
      enabled: true,
      // filepath: "./eslint.config.js",
    },
    viteOptimizeDeps: true,

    // uncomment if you want to auto import ui components
    // dirs: ['./src/components/ui'],
  }),
];

if (!useProxy) {
  plugins.unshift(nitro());
}

export default defineConfig({
  appType: "custom",
  server: {
    host: "0.0.0.0",
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
