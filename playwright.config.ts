import { defineConfig, devices } from "@playwright/test";
import { DISCOGS_OAUTH_TEST_ENV } from "./src/tests/discogsOAuthTestEnv";

const port = 6767;
const baseURL = `http://localhost:${port}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    env: {
      ...process.env,
      NODE_OPTIONS: "",
      DISCOGS_CONSUMER_KEY:
        process.env.DISCOGS_CONSUMER_KEY ??
        DISCOGS_OAUTH_TEST_ENV.DISCOGS_CONSUMER_KEY,
      DISCOGS_CONSUMER_SECRET:
        process.env.DISCOGS_CONSUMER_SECRET ??
        DISCOGS_OAUTH_TEST_ENV.DISCOGS_CONSUMER_SECRET,
    },
  },
});
