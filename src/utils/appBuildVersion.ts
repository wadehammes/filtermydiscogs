const DEVELOPMENT_BUILD_VERSION = "development";

export const getAppBuildVersion = (): string =>
  process.env.VERCEL_GIT_COMMIT_SHA ??
  process.env.VERCEL_DEPLOYMENT_ID ??
  process.env.NEXT_PUBLIC_APP_BUILD_VERSION ??
  DEVELOPMENT_BUILD_VERSION;

export const getClientAppBuildVersion = (): string =>
  process.env.NEXT_PUBLIC_APP_BUILD_VERSION ?? DEVELOPMENT_BUILD_VERSION;

export const shouldCheckForDeploymentUpdates = (): boolean =>
  process.env.NEXT_PUBLIC_VERCEL_ENV === "production" &&
  getClientAppBuildVersion() !== DEVELOPMENT_BUILD_VERSION;

export const DEPLOYMENT_UPDATE_POLL_INTERVAL_MS = 5 * 60 * 1000;

export const isNewerBuildAvailable = (
  mountedVersion: string,
  latestVersion: string | null,
): boolean => Boolean(latestVersion && latestVersion !== mountedVersion);
