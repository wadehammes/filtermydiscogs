import type { NextRequest } from "next/server";
import { getSiteUrl } from "src/utils/helpers";

export const buildImageProxyCorsHeaders = (
  request: NextRequest,
): Record<string, string> => {
  const siteOrigin = new URL(getSiteUrl()).origin;
  const origin = request.headers.get("origin");

  if (!(origin && origin === siteOrigin)) {
    return {};
  }

  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
};
