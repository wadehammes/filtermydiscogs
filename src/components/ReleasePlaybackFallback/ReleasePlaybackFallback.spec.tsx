import { describe, expect, it } from "@jest/globals";
import { ReleasePlaybackFallback } from "src/components/ReleasePlaybackFallback/ReleasePlaybackFallback.component";
import { discogsVideoFactory } from "src/tests/factories/DiscogsVideo.factory";
import { render, screen } from "test-utils";

describe("ReleasePlaybackFallback", () => {
  const fallbackSearchUrl = "https://www.youtube.com/results?search_query=test";
  const discogsVideosUrl =
    "https://www.discogs.com/release/37060431/videos/update";

  it("when the release has no Discogs videos, prompts to add videos on Discogs", () => {
    render(
      <ReleasePlaybackFallback
        discogsReleaseId={37060431}
        fallbackSearchUrl={fallbackSearchUrl}
        videos={[]}
      />,
    );

    expect(
      screen.getByText(/No videos on this release yet/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Add videos on Discogs" }),
    ).toHaveAttribute("href", discogsVideosUrl);
  });

  it("when videos exist but tracks are not linked, shows track-specific copy", () => {
    render(
      <ReleasePlaybackFallback
        discogsReleaseId={37060431}
        fallbackSearchUrl={fallbackSearchUrl}
        tracksLackMatchedVideos
        videos={[discogsVideoFactory.build({ title: "Live cut" })]}
      />,
    );

    expect(
      screen.getByText(/Tracks aren't linked to videos yet/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Live cut" })).toBeInTheDocument();
  });

  it("when the release id is missing, falls back to Search YouTube", () => {
    render(
      <ReleasePlaybackFallback
        discogsReleaseId={null}
        fallbackSearchUrl={fallbackSearchUrl}
        videos={[]}
      />,
    );

    expect(
      screen.getByRole("link", { name: "Search YouTube" }),
    ).toHaveAttribute("href", fallbackSearchUrl);
  });
});
