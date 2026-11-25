import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import { defineConfig, globalIgnores } from "eslint/config";
import prettierConfig from "eslint-config-prettier";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = defineConfig([
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  prettierConfig,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/consistent-type-imports": "warn",
    },
  },
  // Design-system guard rails (docs/03-design/01-design-system.md).
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/components/feedback/notify.tsx", "src/components/ui/sonner.tsx"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message: "Show toasts with `notify` from @/components/feedback/notify.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/(app)/**/*.{ts,tsx}", "src/modules/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "sonner",
              message: "Show toasts with `notify` from @/components/feedback/notify.",
            },
            {
              name: "@/components/ui/button",
              message: "App screens use AppButton from @/components/shared/app-button.",
            },
            {
              name: "@/components/ui/card",
              message:
                "Use a `bg-card rounded-card` section or KpiCard; ui/card is marketing-only.",
            },
          ],
        },
      ],
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src/components/ui/**",
    "src/generated/**",
    "playwright-report/**",
    "test-results/**",
    "coverage/**",
  ]),
]);

export default eslintConfig;
