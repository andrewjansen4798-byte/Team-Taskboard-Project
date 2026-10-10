import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // Ignore generated and dependency files
  globalIgnores(["dist", "node_modules"]),

  // General JavaScript rules
  {
    files: ["**/*.{js,jsx,cjs,mjs}"],
    extends: [js.configs.recommended],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // React frontend
  {
    files: ["src/**/*.{js,jsx}"],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },

  // Node.js backend using CommonJS
  {
    files: ["server/**/*.{js,cjs}"],
    languageOptions: {
      globals: globals.node,
      sourceType: "commonjs",
    },
  },

  // Node.js configuration files
  {
    files: ["**/*.config.{js,cjs,mjs}", "eslint.config.js"],
    languageOptions: {
      globals: globals.node,
    },
  },
]);