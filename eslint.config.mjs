import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from 'eslint-config-prettier/flat'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    "node_modules/**",
    ".next/**",
    "out/**",
    "build/**",
    "dist/**",
    "coverage/**",
    "**/*.min.js",
    "next-env.d.ts",
    ".cache/**",
  ]),
  {
    // Project-level rule overrides
    rules: {
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      'react/no-unescaped-entities': 'off',
    },
  },
]);

export default eslintConfig;
