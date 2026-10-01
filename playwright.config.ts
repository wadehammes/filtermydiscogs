import { defineConfig, devices } from "@playwright/test";
import { E2E_SMOKE_SPEC_FILES } from "./e2e/smokeSpecs.constants";
import { RESPONSIVE_VIEWPORT_PRESETS } from "./src/constants/layoutMediaQueries";
import { DISCOGS_OAUTH_TEST_ENV } from "./src/tests/discogsOAuthTestEnv";

const port = 6767;
const baseURL = `http://localhost:${port}`;
const isCi = Boolean(process.env.CI);
const isSmokeSuite = process.env.E2E_SMOKE === "1";

const chromiumProject = {
  name: "chromium",
  use: { ...devices["Desktop Chrome"] },
};

const responsiveProjects = [
  chromiumProject,
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
      viewport: RESPONSIVE_VIEWPORT_PRESETS.tabletPortrait,
    },
  },
] as const;

const e2eWebServerEnv = {
  ...process.env,
  NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED: "1",
  NODE_OPTIONS: "",
  DISCOGS_CONSUMER_KEY:
    process.env.DISCOGS_CONSUMER_KEY ??
    DISCOGS_OAUTH_TEST_ENV.DISCOGS_CONSUMER_KEY,
  DISCOGS_CONSUMER_SECRET:
    process.env.DISCOGS_CONSUMER_SECRET ??
    DISCOGS_OAUTH_TEST_ENV.DISCOGS_CONSUMER_SECRET,
};

export default defineConfig({
  testDir: "./e2e",
  ...(isSmokeSuite ? { testMatch: [...E2E_SMOKE_SPEC_FILES] } : {}),
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: isSmokeSuite ? [chromiumProject] : [...responsiveProjects],
  webServer: {
    command: isCi
      ? "pnpm exec next start -p 6767"
      : "pnpm exec next dev -p 6767",
    url: baseURL,
    reuseExistingServer: !isCi,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "ignore",
    env: e2eWebServerEnv,
  },
});
