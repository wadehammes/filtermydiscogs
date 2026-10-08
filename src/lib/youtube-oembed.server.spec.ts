import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { fetchYoutubeOembedMetadata } from "src/lib/youtube-oembed.server";

describe("fetchYoutubeOembedMetadata", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("returns title and channel from YouTube oEmbed", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          title: "Never Gonna Give You Up",
          author_name: "Rick Astley",
        }),
        { status: 200 },
      ),
    );

    await expect(fetchYoutubeOembedMetadata("dQw4w9WgXcQ")).resolves.toEqual({
      title: "Never Gonna Give You Up",
      authorName: "Rick Astley",
    });
  });

  it("returns null when oEmbed responds with an error", async () => {
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response("Not Found", { status: 404 }));

    await expect(fetchYoutubeOembedMetadata("dQw4w9WgXcQ")).resolves.toBeNull();
  });
});
