import { resolveSentryEnabled } from "src/lib/sentry/sentryInitOptions";

export const resolveBetaBannerVisible = (): boolean => resolveSentryEnabled();
