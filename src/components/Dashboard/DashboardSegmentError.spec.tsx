import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import { DashboardSegmentError } from "src/components/Dashboard/DashboardSegmentError.component";
import { getDashboardSegmentErrorContent } from "src/utils/getDashboardSegmentErrorContent";
import { render, screen } from "test-utils";

describe("DashboardSegmentError", () => {
  it("when Discogs is unavailable, shows segment copy and status link", () => {
    const content = getDashboardSegmentErrorContent(
      new ApiFetchError(503),
      "top_tracks",
    );

    render(<DashboardSegmentError content={content} />);

    expect(screen.getByText("Playback stats unavailable")).toBeInTheDocument();
    expect(
      screen.getByText(/couldn't load your collection/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Discogs status" }),
    ).toHaveAttribute("href", "https://status.discogs.com");
  });
});
