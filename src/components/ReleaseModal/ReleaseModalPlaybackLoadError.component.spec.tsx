import { describe, expect, it } from "@jest/globals";
import { ApiFetchError } from "src/api/apiFetchError";
import { ReleaseModalPlaybackLoadError } from "src/components/ReleaseModal/ReleaseModalPlaybackLoadError.component";
import { render, screen } from "test-utils";

describe("ReleaseModalPlaybackLoadError", () => {
  it("shows Discogs outage copy and status link for upstream 502", () => {
    render(
      <ReleaseModalPlaybackLoadError
        error={new ApiFetchError(502, "Bad gateway")}
        onRetry={() => undefined}
      />,
    );

    expect(
      screen.getByText("Discogs is having trouble right now"),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Discogs status" }),
    ).toHaveAttribute("href", "https://status.discogs.com");
    expect(
      screen.getByText(/couldn't load the track listing/i),
    ).toBeInTheDocument();
  });

  it("shows generic copy for unknown errors", () => {
    render(
      <ReleaseModalPlaybackLoadError
        error={new Error("network")}
        onRetry={() => undefined}
      />,
    );

    expect(
      screen.getByText("Could not load track listing for this release."),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Discogs is having trouble right now"),
    ).not.toBeInTheDocument();
  });
});
