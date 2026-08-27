import { describe, expect, it } from "@jest/globals";
import {
  getAppBuildVersion,
  getClientAppBuildVersion,
  isNewerBuildAvailable,
  shouldCheckForDeploymentUpdates,
} from "src/utils/appBuildVersion";

describe("getAppBuildVersion", () => {
  it("prefers Vercel git commit sha", () => {
    const previousSha = process.env.VERCEL_GIT_COMMIT_SHA;
    const previousDeploymentId = process.env.VERCEL_DEPLOYMENT_ID;

    process.env.VERCEL_GIT_COMMIT_SHA = "abc123";
    process.env.VERCEL_DEPLOYMENT_ID = "dpl_456";

    expect(getAppBuildVersion()).toBe("abc123");

    if (previousSha === undefined) {
      delete process.env.VERCEL_GIT_COMMIT_SHA;
    } else {
      process.env.VERCEL_GIT_COMMIT_SHA = previousSha;
    }

    if (previousDeploymentId === undefined) {
      delete process.env.VERCEL_DEPLOYMENT_ID;
    } else {
      process.env.VERCEL_DEPLOYMENT_ID = previousDeploymentId;
    }
  });
});

describe("shouldCheckForDeploymentUpdates", () => {
  it("returns true only on production with a real build version", () => {
    const previousEnv = process.env.NEXT_PUBLIC_VERCEL_ENV;
    const previousVersion = process.env.NEXT_PUBLIC_APP_BUILD_VERSION;

    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_BUILD_VERSION = "abc123";
    expect(shouldCheckForDeploymentUpdates()).toBe(true);

    process.env.NEXT_PUBLIC_VERCEL_ENV = "preview";
    expect(shouldCheckForDeploymentUpdates()).toBe(false);

    process.env.NEXT_PUBLIC_VERCEL_ENV = "production";
    process.env.NEXT_PUBLIC_APP_BUILD_VERSION = "development";
    expect(shouldCheckForDeploymentUpdates()).toBe(false);

    if (previousEnv === undefined) {
      delete process.env.NEXT_PUBLIC_VERCEL_ENV;
    } else {
      process.env.NEXT_PUBLIC_VERCEL_ENV = previousEnv;
    }

    if (previousVersion === undefined) {
      delete process.env.NEXT_PUBLIC_APP_BUILD_VERSION;
    } else {
      process.env.NEXT_PUBLIC_APP_BUILD_VERSION = previousVersion;
    }
  });
});

describe("isNewerBuildAvailable", () => {
  it("returns true when the latest version differs", () => {
    expect(isNewerBuildAvailable("mounted", "latest")).toBe(true);
  });

  it("returns false when versions match or latest is missing", () => {
    expect(isNewerBuildAvailable("mounted", "mounted")).toBe(false);
    expect(isNewerBuildAvailable("mounted", null)).toBe(false);
  });
});

describe("getClientAppBuildVersion", () => {
  it("falls back to development when unset", () => {
    const previousVersion = process.env.NEXT_PUBLIC_APP_BUILD_VERSION;

    delete process.env.NEXT_PUBLIC_APP_BUILD_VERSION;
    expect(getClientAppBuildVersion()).toBe("development");

    if (previousVersion === undefined) {
      delete process.env.NEXT_PUBLIC_APP_BUILD_VERSION;
    } else {
      process.env.NEXT_PUBLIC_APP_BUILD_VERSION = previousVersion;
    }
  });
});
