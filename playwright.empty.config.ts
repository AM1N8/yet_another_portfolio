import { defineConfig } from "@playwright/test";
import config from "./playwright.config";

export default defineConfig({
  ...config,
  testDir: "./tests/empty",
  outputDir: "test-results/empty",
  webServer: {
    command:
      "npm run build && npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      PORTFOLIO_BROWSER_TEST: "1",
      ACTIVITY_TEST_EMPTY: "1",
      NODE_OPTIONS: "--import ./tests/fixtures/github-api.mjs",
      GITHUB_TOKEN: "",
    },
  },
});
