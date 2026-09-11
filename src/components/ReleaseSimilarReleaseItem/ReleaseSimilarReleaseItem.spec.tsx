import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { ReleaseSimilarReleaseItem } from "src/components/ReleaseSimilarReleaseItem/ReleaseSimilarReleaseItem.component";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";
import {
  expectNoReleaseOpenPrefetchAfterHover,
  expectReleaseOpenPrefetchAfterHover,
  setupReleaseOpenPrefetchHoverTimers,
  teardownReleaseOpenPrefetchHoverTimers,
} from "src/tests/utils/expectReleaseOpenPrefetchOnHover";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render, screen, waitFor } from "test-utils";

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();

jest.mock("src/api/urls");

describe("ReleaseSimilarReleaseItem", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setupDefaultCrateApiMocks(mockApi);
    setupFetchDiscogsReleaseMock(
      mockApi,
      discogsReleaseJsonFactory.withTracklistAndVideos({ id: 249504 }),
    );
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );
  });

  it("prefetches release detail when the row shell is hovered", async () => {
    const onReleaseClick = jest.fn();
    const similarRelease = releaseFactory.withTitle("Similar Album", 249504, {
      instance_id: "similar-instance",
    });
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <ReleaseSimilarReleaseItem
        release={similarRelease}
        onReleaseClick={onReleaseClick}
      />,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdReleaseSimilarItem"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("prefetches release detail when a row action is hovered", async () => {
    const onReleaseClick = jest.fn();
    const similarRelease = releaseFactory.withTitle("Similar Album", 249504, {
      instance_id: "similar-instance",
    });
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(
      <ReleaseSimilarReleaseItem
        release={similarRelease}
        onReleaseClick={onReleaseClick}
      />,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    try {
      await expectReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByRole("button", { name: "Add to crates" }),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("does not prefetch release detail when onReleaseClick is omitted", async () => {
    const similarRelease = releaseFactory.withTitle("Similar Album", 249504, {
      instance_id: "similar-instance",
    });
    const user = setupReleaseOpenPrefetchHoverTimers();

    render(<ReleaseSimilarReleaseItem release={similarRelease} />, {
      authInitialState: testAuthenticatedAuthState,
    });

    try {
      await expectNoReleaseOpenPrefetchAfterHover({
        hoverTarget: screen.getByTestId("fmdReleaseSimilarItem"),
        mockDiscogsRelease: mockApi.discogsRelease,
        user,
      });
    } finally {
      teardownReleaseOpenPrefetchHoverTimers();
    }
  });

  it("applies listItemInCrate when the release is in the active crate", async () => {
    const similarRelease = releaseFactory.withTitle("Similar Album", 249504, {
      instance_id: "similar-instance",
    });
    const defaultCrate = crateFactory.defaultTestCrate();

    mockApiResponse(
      true,
      mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(defaultCrate, [
        similarRelease,
      ]),
      apiError,
    );

    const { container } = render(
      <ReleaseSimilarReleaseItem release={similarRelease} />,
      {
        authInitialState: testAuthenticatedAuthState,
      },
    );

    await waitFor(() => {
      const item = container.querySelector(
        '[data-testid="fmdReleaseSimilarItem"]',
      );
      expect(item?.className).toContain("listItemInCrate");
    });
  });

  it("adds a release to a crate from the row action menu", async () => {
    const user = userEvent.setup();
    const similarRelease = releaseFactory.build({
      instance_id: "similar-instance",
      basic_information: {
        ...releaseFactory.withStyles(["Techno", "House"]).basic_information,
        master_id: 200,
        title: "Similar Album",
      },
    });

    render(<ReleaseSimilarReleaseItem release={similarRelease} />, {
      authInitialState: testAuthenticatedAuthState,
    });

    await user.click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(mockApi.addReleaseToCrate).toHaveBeenCalled();
    });
  });
});
