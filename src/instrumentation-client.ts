import * as Sentry from "@sentry/react";
import { buildBrowserSentryInitOptions } from "src/lib/sentry/sentryInitOptions";
import {
  installViewTransitionDocumentGuard,
  installViewTransitionRecoverableErrorFilter,
} from "src/utils/viewTransitionInterruptions";

Sentry.init(buildBrowserSentryInitOptions());

installViewTransitionDocumentGuard();
installViewTransitionRecoverableErrorFilter();
