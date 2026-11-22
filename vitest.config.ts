import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["src/tests/**/*.test.ts"],
        clearMocks: true,
        fileParallelism: false,
        testTimeout: 15000,
        hookTimeout: 15000,
        coverage: {
            provider: "v8",
            include: ["src/**/*.ts"],
            exclude: ["src/tests/**", "src/config/**"],
            reporter: ["text", "html", "json-summary", "lcov"],
            reportsDirectory: "coverage",
            thresholds: { lines: 60, statements: 60, functions: 60, branches: 60 },
        },
    },
});
