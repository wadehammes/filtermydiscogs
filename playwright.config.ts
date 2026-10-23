import { defineConfig, devices } from "@playwright/test";
import {
  E2E_TAG_DESKTOP_ONLY_GREP,
  E2E_TAG_MOBILE_ONLY_GREP,
} from "./e2e/e2eProjectTags.constants";
import { E2E_SMOKE_SPEC_FILES } from "./e2e/smokeSpecs.constants";
import { RESPONSIVE_VIEWPORT_PRESETS } from "./src/constants/layoutMediaQueries";
import { DISCOGS_OAUTH_TEST_ENV } from "./src/tests/discogsOAuthTestEnv";
import { E2E_FEATURE_FLAG_ENV } from "./src/tests/e2eFeatureFlagEnv";

const port = 6767;
const baseURL = `http://localhost:${port}`;
const isCi = Boolean(process.env.CI);
const isSmokeSuite = process.env.E2E_SMOKE === "1";

const chromiumProject = {
  name: "chromium",
  use: { ...devices["Desktop Chrome"] },
  grepInvert: E2E_TAG_MOBILE_ONLY_GREP,
};

const responsiveProjects = [
  chromiumProject,
  {
    name: "phone",
    use: {
      ...devices["Desktop Chrome"],
      viewport: RESPONSIVE_VIEWPORT_PRESETS.phonePortrait,
    },
    grepInvert: E2E_TAG_DESKTOP_ONLY_GREP,
  },
  {
    name: "tablet",
    use: {
      ...devices["Desktop Chrome"],
      viewport: RESPONSIVE_VIEWPORT_PRESETS.tabletPortrait,
    },
    grepInvert: E2E_TAG_DESKTOP_ONLY_GREP,
  },
] as const;

const e2eWebServerEnv = {
  ...process.env,
  ...E2E_FEATURE_FLAG_ENV,
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
  timeout: 120_000,
  ...(isSmokeSuite ? { testMatch: [...E2E_SMOKE_SPEC_FILES] } : {}),
  fullyParallel: true,
  forbidOnly: isCi,
  retries: isCi ? 1 : 0,
  workers: isCi ? (isSmokeSuite ? 4 : 1) : undefined,
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
