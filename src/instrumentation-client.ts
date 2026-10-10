import * as Sentry from "@sentry/react";
import { buildSharedSentryInitOptions } from "src/lib/sentry/sentryInitOptions";
import {
  installViewTransitionDocumentGuard,
  installViewTransitionRecoverableErrorFilter,
} from "src/utils/viewTransitionInterruptions";

Sentry.init({
  ...buildSharedSentryInitOptions(),
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.05 : 0,
});

installViewTransitionDocumentGuard();
installViewTransitionRecoverableErrorFilter();
