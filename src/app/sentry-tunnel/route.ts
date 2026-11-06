import { createSentryTunnelRoute } from "@sentry/nextjs/tunnel";
import { resolveSentryDsn } from "src/lib/sentry/sentryInitOptions";

const dsn = resolveSentryDsn()?.trim();

export const { POST } = createSentryTunnelRoute(
  dsn ? { allowedDsns: [dsn] } : {},
);
