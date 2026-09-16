import { describe, expect, it } from "@jest/globals";
import { YOUTUBE_EMBED_PLAYER_WIDTH } from "src/utils/postYoutubePlayerCommand";
import { getVideoPanelMaxScaleForYoutubeEmbed } from "./videoPanelLayoutStorage";

describe("getVideoPanelMaxScaleForYoutubeEmbed", () => {
  it("returns the scale needed for the panel width to match the YouTube embed layout width", () => {
    expect(getVideoPanelMaxScaleForYoutubeEmbed(320)).toBe(
      YOUTUBE_EMBED_PLAYER_WIDTH / 320,
    );
  });

  it("falls back to unit scale when the base width is invalid", () => {
    expect(getVideoPanelMaxScaleForYoutubeEmbed(0)).toBe(1);
  });
});
