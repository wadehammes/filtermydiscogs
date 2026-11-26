import { createSentryTunnelRoute } from "@sentry/nextjs/tunnel";
import { resolveSentryDsn } from "src/lib/sentry/sentryInitOptions";

const SENTRY_TUNNEL_MAX_BODY_BYTES_DEFAULT = 5 * 1024 * 1024;

const resolveSentryTunnelMaxBodyBytes = (): number => {
  const parsed = Number.parseInt(
    process.env.SENTRY_TUNNEL_MAX_BODY_BYTES ||
      String(SENTRY_TUNNEL_MAX_BODY_BYTES_DEFAULT),
    10,
  );

  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : SENTRY_TUNNEL_MAX_BODY_BYTES_DEFAULT;
};

export const maxDuration = 60;

const dsn = resolveSentryDsn()?.trim();

const { POST: forwardSentryTunnelPost } = createSentryTunnelRoute(
  dsn ? { allowedDsns: [dsn] } : {},
);

export const POST = async (request: Request): Promise<Response> => {
  const contentLengthHeader = request.headers.get("content-length");
  const contentLength = contentLengthHeader
    ? Number.parseInt(contentLengthHeader, 10)
    : Number.NaN;

  if (
    Number.isFinite(contentLength) &&
    contentLength > resolveSentryTunnelMaxBodyBytes()
  ) {
    return new Response("Payload too large", { status: 413 });
  }

  return forwardSentryTunnelPost(request);
};
