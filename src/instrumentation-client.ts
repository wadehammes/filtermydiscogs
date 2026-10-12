import { captureRouterTransitionStart } from "@sentry/nextjs";
import * as Sentry from "@sentry/react";
import { buildSentryClientInitOptions } from "src/lib/sentry/buildSentryClientInitOptions.client";
import {
  installViewTransitionDocumentGuard,
  installViewTransitionRecoverableErrorFilter,
} from "src/utils/viewTransitionInterruptions";

Sentry.init(buildSentryClientInitOptions());

installViewTransitionDocumentGuard();
installViewTransitionRecoverableErrorFilter();

export const onRouterTransitionStart = captureRouterTransitionStart;
