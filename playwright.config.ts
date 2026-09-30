import { defineConfig, devices } from "@playwright/test";
import { RESPONSIVE_VIEWPORT_PRESETS } from "./src/constants/layoutMediaQueries";
import { DISCOGS_OAUTH_TEST_ENV } from "./src/tests/discogsOAuthTestEnv";

const port = 6767;
const baseURL = `http://localhost:${port}`;
const isCi = Boolean(process.env.CI);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 4 : undefined,
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
    {
      name: "phone",
      use: {
        ...devices["Desktop Chrome"],
        viewport: RESPONSIVE_VIEWPORT_PRESETS.phonePortrait,
      },
    },
    {
      name: "tablet",
      use: {
        ...devices["Desktop Chrome"],
        viewport: {
          width: 834,
          height: RESPONSIVE_VIEWPORT_PRESETS.tabletPortrait.height,
        },
      },
    },
  ],
  webServer: {
    command: "pnpm exec next dev -p 6767",
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "ignore",
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
