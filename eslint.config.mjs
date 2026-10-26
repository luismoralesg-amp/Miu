import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      ".claude/**",
      ".next/**",
      "docs/**",
      "playwright-report/**",
      "test-results/**",
      "next-env.d.ts",
    ],
  },
  {
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    // Nothing outside a module reaches into its adapters: pick them through the module's index.
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/adapters/**"],
              message: "Usa el puerto desde el índice del módulo (@/modules/<módulo>).",
            },
          ],
        },
      ],
    },
  },
  {
    // A module talks to another only through its public API, never its domain, ports or adapters.
    files: ["src/modules/**/*.{ts,tsx}"],
    ignores: ["src/**/*.test.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/domain/**", "@/modules/*/ports/**", "@/modules/*/adapters/**"],
              message:
                "Un módulo no importa el dominio de otro: usa su API pública (@/modules/<módulo>).",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
