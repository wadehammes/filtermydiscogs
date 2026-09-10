import { describe, expect, it } from "@jest/globals";
import { ReleaseSummaryHeroToolbar } from "src/components/ReleaseSummaryHeroToolbar/ReleaseSummaryHeroToolbar.component";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen } from "test-utils";

describe("ReleaseSummaryHeroToolbar", () => {
  it("renders View on Discogs when the release has a Discogs URL", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        resource_url: "https://api.discogs.com/releases/12345",
      },
    });

    render(<ReleaseSummaryHeroToolbar release={release} onClose={() => {}} />);

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/12345");
  });
});
