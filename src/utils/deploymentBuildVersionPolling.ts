export const DEPLOYMENT_UPDATE_POLL_INTERVAL_MS = 60_000;

export const buildVersionRefetchIntervalMs = (
  pollingEnabled: boolean,
): number | false => {
  if (!pollingEnabled) {
    return false;
  }

  if (
    typeof document !== "undefined" &&
    document.visibilityState === "hidden"
  ) {
    return false;
  }

  return DEPLOYMENT_UPDATE_POLL_INTERVAL_MS;
};

export const shouldEagerRefetchBuildVersionOnVisibility = (
  visibilityState: DocumentVisibilityState,
): boolean => visibilityState === "visible";
