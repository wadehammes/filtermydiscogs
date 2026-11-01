import { describe, expect, it } from "@jest/globals";
import { PublicPlaylistSummaryHero } from "src/components/PublicPlaylist/PublicPlaylistSummaryHero.component";
import { render, screen } from "test-utils";

const defaultProps = {
  title: "Demo playlist",
  coverThumbUrls: [] as string[],
  coverLabel: "Cover art",
  metaLine: "By wadehammes · 13 tracks",
};

describe("PublicPlaylistSummaryHero", () => {
  it("renders no engagement row when view and play counts are zero", () => {
    render(
      <PublicPlaylistSummaryHero
        {...defaultProps}
        shareStats={{ publicViewCount: 0, publicPlayCount: 0 }}
      />,
    );

    expect(
      screen.queryByRole("img", { name: /views/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /plays/i }),
    ).not.toBeInTheDocument();
  });

  it("renders icon and numeric view count without a views label", () => {
    render(
      <PublicPlaylistSummaryHero
        {...defaultProps}
        shareStats={{ publicViewCount: 3, publicPlayCount: 0 }}
      />,
    );

    expect(screen.getByRole("img", { name: "3 views" })).toBeInTheDocument();
    expect(screen.queryByText("3 views")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("img", { name: /plays/i }),
    ).not.toBeInTheDocument();
  });
});
