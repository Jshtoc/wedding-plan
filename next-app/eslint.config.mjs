import nextPlugin from "@next/eslint-plugin-next";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import hooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "@next/next": nextPlugin,
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": hooksPlugin,
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,
      // TypeScript
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      // React hooks
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Relax for this project
      "@next/next/no-img-element": "off",
      "react/forbid-dom-props": "off",
    },
  },
  {
    ignores: [".next/", "node_modules/"],
  },
];
