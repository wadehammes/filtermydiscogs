import { NextResponse } from "next/server";
import { getAppBuildVersion } from "src/utils/appBuildVersion";

export async function GET() {
  return NextResponse.json(
    { version: getAppBuildVersion() },
    {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
      },
    },
  );
}
