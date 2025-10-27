import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "packages/*/src/**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "apps/*/src/**/*.{test,spec}.?(c|m)[jt]s?(x)",
      "tests/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)", // Phase 1.6: Unit tests per COPILOT_OPERATING_PROCEDURE.md
    ],
    exclude: [
      "node_modules/**",
      "dist/**",
      "build/**",
      ".next/**",
      "tests/e2e/**", // E2E tests use Playwright, not vitest
      "tests/e2e-playwright/**", // Playwright tests
      "tests/acceptance/**", // Separate test harness
      "tests/integration/**", // May use different runner
    ],
    reporters: ["default"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "packages/*/src/**/*.ts",
        "packages/*/src/**/*.tsx",
        "apps/*/src/**/*.ts",
        "apps/*/src/**/*.tsx",
      ],
      exclude: ["**/*.d.ts", "**/*.config.*", "**/dist/**", "**/.next/**"],
    },
    testTimeout: 15000,
    hookTimeout: 15000,
  },
  resolve: {
    alias: {
      "@tenant": resolve(__dirname, "./apps/tenant-app/src"),
      "@provider": resolve(__dirname, "./apps/provider-portal/src"),
    },
  },
});
