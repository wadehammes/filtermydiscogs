import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { PublicMobileReleaseCardPageObject } from "src/components/ReleaseCard/PublicMobileReleaseCard.po";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { screen } from "test-utils";

jest.mock("src/api/urls");

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");

let po: PublicMobileReleaseCardPageObject;

describe("PublicMobileReleaseCard", () => {
  beforeEach(() => {
    po = new PublicMobileReleaseCardPageObject();
    jest.clearAllMocks();
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
    mockApiResponse(
      true,
      mockApi.discogsRelease,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
      apiError,
    );
  });

  it("renders release title and format pills without crate controls", () => {
    const release = releaseFactory.withNamedFormats(["Vinyl"]);

    po.renderPublicMobileReleaseCard({ release });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByText(release.basic_information.title),
    ).toBeInTheDocument();
    expect(screen.getByText("Vinyl")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
  });

  it("prefetches release detail when the card shell is hovered", async () => {
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderPublicMobileReleaseCard({ onReleaseClick });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId(po.testId),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("prefetches release detail when a format pill is hovered", async () => {
    const release = releaseFactory.withNamedFormats(["Vinyl"]);
    const onReleaseClick = jest.fn();
    const user = setupReleaseOpenPrefetchHoverTimers();

    po.renderPublicMobileReleaseCard({ release, onReleaseClick });

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByText("Vinyl"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("calls onReleaseClick when the cover is activated", async () => {
    const release = releaseFactory.withDisplayDefaults();
    const onReleaseClick = jest.fn();
    const user = userEvent.setup();

    po.renderPublicMobileReleaseCard({ release, onReleaseClick });

    await user.click(
      screen.getByRole("button", {
        name: `Open release details for ${release.basic_information.title}`,
      }),
    );

    expect(onReleaseClick).toHaveBeenCalledWith(String(release.instance_id));
  });
});
