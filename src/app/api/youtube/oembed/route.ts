import type { NextRequest } from "next/server";
import { getVerifiedUserFromRequestWithRateLimit } from "src/lib/api-helpers";
import { privateRouteJson } from "src/lib/private-route-response";
import { youtubeOembedQuerySchema } from "src/lib/validation/youtube.schemas";
import { fetchYoutubeOembedMetadata } from "src/lib/youtube-oembed.server";

export const GET = async (request: NextRequest) => {
  const verified = await getVerifiedUserFromRequestWithRateLimit(request, true);

  if ("error" in verified) {
    return verified.error;
  }

  const { searchParams } = new URL(request.url);
  const parsedQuery = youtubeOembedQuerySchema.safeParse({
    video_id: searchParams.get("video_id") ?? "",
  });

  if (!parsedQuery.success) {
    return privateRouteJson(
      { error: "Invalid YouTube video id" },
      { status: 400 },
    );
  }

  const metadata = await fetchYoutubeOembedMetadata(parsedQuery.data.video_id);

  if (!metadata) {
    return privateRouteJson({ error: "Video not found" }, { status: 404 });
  }

  return privateRouteJson(metadata);
};
