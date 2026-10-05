import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["lib/learning/**/*.test.ts", "tests/**/*.test.ts"],
  },
});
