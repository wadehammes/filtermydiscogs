import { beforeEach, describe, expect, it } from "@jest/globals";
import * as apiHelpers from "src/api/helpers";
import { PublicReleaseSummaryHero } from "src/components/ReleaseModal/PublicReleaseSummaryHero.component";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen } from "test-utils";

jest.mock("src/api/helpers");

const mockApi = jest.mocked(apiHelpers);

describe("PublicReleaseSummaryHero", () => {
  beforeEach(() => {
    mockApi.fetchDiscogsRelease.mockResolvedValue(
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
  });

  it("renders format and style pills as static labels", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        formats: [{ name: "Vinyl", qty: "1" }],
        styles: ["House"],
      },
    });

    render(
      <PublicReleaseSummaryHero
        release={release}
        titleId="public-release-modal-title"
        onClose={() => {}}
      />,
    );

    expect(screen.getByText("Vinyl")).toBeInTheDocument();
    expect(screen.getByText("House")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /filter by vinyl format/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /filter by house style/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add to crate/i }),
    ).not.toBeInTheDocument();
  });
});
