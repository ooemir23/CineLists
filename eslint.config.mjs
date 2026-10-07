import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // These async Server Components intentionally evaluate the request time.
  // Client render purity and component identity rules do not apply to them.
  {
    files: ["app/page.tsx", "app/admin/page.tsx", "app/admin/users/*/page.tsx"],
    rules: { "react-hooks/purity": "off" },
  },
  {
    // Nested async Server Components have no client state to reset.
    files: ["components/home/home-top-section.tsx", "app/[[]type[]]/[[]id[]]/page.tsx"],
    rules: { "react-hooks/static-components": "off" },
  },
  {
    files: ["**/*.cjs"],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "scripts/**",
  ]),
  {
    files: ["**/*.{js,jsx,mjs,ts,tsx,mts,cts}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "react/no-unescaped-entities": "off",
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
