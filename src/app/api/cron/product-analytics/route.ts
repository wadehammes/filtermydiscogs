import { type NextRequest, NextResponse } from "next/server";
import { runProductAnalyticsMaintenance } from "src/lib/product-analytics-maintenance.server";

const isAuthorizedCronRequest = (request: NextRequest): boolean => {
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return false;
  }

  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
};

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runProductAnalyticsMaintenance();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Product analytics maintenance error:", error);
    return NextResponse.json(
      { error: "Product analytics maintenance failed" },
      { status: 500 },
    );
  }
}
