import { beforeEach, describe, expect, it } from "@jest/globals";
import { api } from "src/api/urls";
import { PublicReleaseSummaryHero } from "src/components/PublicReleaseSummaryHero/PublicReleaseSummaryHero.component";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);

describe("PublicReleaseSummaryHero", () => {
  beforeEach(() => {
    mockApi.discogsRelease.mockResolvedValue(
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
  });

  it("renders format and genre/style pills as static labels", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        formats: [{ name: "Vinyl", qty: "1" }],
        genres: ["Electronic"],
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
    expect(screen.getByText("Electronic")).toBeInTheDocument();
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
