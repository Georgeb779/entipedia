import path from "node:path";
import { fileURLToPath } from "node:url";

import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default tseslint.config(
  { ignores: ["dist", "dev-dist", "node_modules", "auto-imports.d.ts", "**/*.d.ts"] },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      parserOptions: {
        project: path.join(__dirname, "tsconfig.eslint.json"),
        tsconfigRootDir: __dirname,
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-empty-object-type": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
);
