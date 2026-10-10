import * as Sentry from "@sentry/nextjs";
import { buildSharedSentryInitOptions } from "src/lib/sentry/sentryInitOptions";

Sentry.init({
  ...buildSharedSentryInitOptions(),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
});
