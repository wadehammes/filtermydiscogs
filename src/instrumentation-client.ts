import { captureRouterTransitionStart } from "@sentry/nextjs";
import * as Sentry from "@sentry/react";
import { buildSentryClientInitOptions } from "src/lib/sentry/buildSentryClientInitOptions.client";
import { configureBrowserZod } from "src/lib/validation/configureBrowserZod.client";
import {
  installViewTransitionDocumentGuard,
  installViewTransitionRecoverableErrorFilter,
} from "src/utils/viewTransitionInterruptions";

configureBrowserZod();
Sentry.init(buildSentryClientInitOptions());

installViewTransitionDocumentGuard();
installViewTransitionRecoverableErrorFilter();

export const onRouterTransitionStart = captureRouterTransitionStart;
