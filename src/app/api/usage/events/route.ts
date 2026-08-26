import { type NextRequest, NextResponse } from "next/server";
import { getOptionalVerifiedUserFromRequest } from "src/lib/auth-request";
import {
  ANALYTICS_EVENTS_RATE_LIMIT_CONFIG,
  checkIpRateLimit,
} from "src/lib/ip-rate-limit";
import {
  insertProductAnalyticsEvents,
  validateProductAnalyticsBatch,
} from "src/lib/product-analytics.server";
import { rethrowNextInternalError } from "src/lib/rethrowNextInternalError";

const parseAnalyticsEventsBody = async (
  request: NextRequest,
): Promise<unknown> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return request.json();
  }

  const text = await request.text();
  if (!text.trim()) {
    throw new Error("empty body");
  }

  return JSON.parse(text) as unknown;
};

export async function POST(request: NextRequest) {
  const rateLimit = checkIpRateLimit(
    request,
    ANALYTICS_EVENTS_RATE_LIMIT_CONFIG,
  );

  if (!rateLimit.allowed) {
    return rateLimit.response;
  }

  let body: unknown;

  try {
    body = await parseAnalyticsEventsBody(request);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const eventsField =
    typeof body === "object" && body !== null && "events" in body
      ? (body as { events?: unknown }).events
      : undefined;
  const validation = validateProductAnalyticsBatch(eventsField);

  if ("error" in validation) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }

  const user = await getOptionalVerifiedUserFromRequest(request);
  const userId = user?.userId ?? null;

  try {
    await insertProductAnalyticsEvents(validation.events, userId);
  } catch (error) {
    rethrowNextInternalError(error);
    console.error("Product analytics ingest error:", error);
    return NextResponse.json(
      { error: "Failed to store analytics events" },
      { status: 500 },
    );
  }

  return NextResponse.json({ ok: true });
}
