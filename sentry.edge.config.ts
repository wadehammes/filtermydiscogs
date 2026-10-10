import * as Sentry from "@sentry/nextjs";
import { buildSharedSentryInitOptions } from "src/lib/sentry/sentryInitOptions";

Sentry.init({
  ...buildSharedSentryInitOptions(),
  tracesSampleRate: 0,
});
