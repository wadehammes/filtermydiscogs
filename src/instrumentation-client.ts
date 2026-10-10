import { captureRouterTransitionStart } from "@sentry/nextjs";
import * as Sentry from "@sentry/react";
import { buildBrowserSentryInitOptions } from "src/lib/sentry/sentryInitOptions";
import { buildSentryReplayClientOptions } from "src/lib/sentry/sentryReplay.client";
import {
  installViewTransitionDocumentGuard,
  installViewTransitionRecoverableErrorFilter,
} from "src/utils/viewTransitionInterruptions";

Sentry.init({
  ...buildBrowserSentryInitOptions(),
  ...buildSentryReplayClientOptions(),
});

installViewTransitionDocumentGuard();
installViewTransitionRecoverableErrorFilter();

export const onRouterTransitionStart = captureRouterTransitionStart;
