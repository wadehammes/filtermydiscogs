import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const resolveBetaBannerVisible = (
  onSubmitBugReport?: () => void,
): boolean => onSubmitBugReport !== undefined || resolveSentryEnabled();
