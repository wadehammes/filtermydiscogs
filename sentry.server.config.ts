import * as Sentry from "@sentry/nextjs";
import { buildServerSentryInitOptions } from "src/lib/buildServerSentryInitOptions.server";

Sentry.init(buildServerSentryInitOptions());
