import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { api } from "src/api/urls";
import { ReleaseSummaryHero } from "src/components/ReleaseSummaryHero/ReleaseSummaryHero.component";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { releaseCrateMembershipResponseFactory } from "src/tests/factories/ReleaseCrateMembershipResponse.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render, screen, waitFor } from "test-utils";

const mockUseMediaQuery = jest.fn(() => false);

const mockApi = jest.mocked(api);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;
const defaultCrateWithCount = crateWithCountFactory.defaultTestCrate();
const defaultCrate = crateFactory.defaultTestCrate();

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

jest.mock("src/api/urls");

jest.mock("src/hooks/useFilterAtoms.hook", () => ({
  useSelectedFormats: () => [],
  useSelectedStyles: () => [],
  useFiltersDispatch: () => jest.fn(),
  useAllReleases: () => [],
}));

jest.mock("src/hooks/usePillClickHandler.hook", () => ({
  usePillClickHandler: () => jest.fn(),
}));

const setupReleaseDetailMock = (
  attributes: Parameters<
    typeof discogsReleaseJsonFactory.withTracklistAndVideos
  >[0] = {},
) => {
  mockApiResponse(
    true,
    mockApi.discogsRelease,
    discogsReleaseJsonFactory.withTracklistAndVideos({
      id: RELEASE_ID,
      ...attributes,
    }),
    apiError,
  );
};

describe("ReleaseSummaryHero", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMediaQuery.mockReturnValue(false);
    setupDefaultCrateApiMocks(mockApi);
    mockApiResponse(
      true,
      mockApi.addReleaseToCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.removeReleaseFromCrate,
      crateMutationSuccessFactory.build(),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build(),
      apiError,
    );
    setupReleaseDetailMock();
  });

  it("exports shared modal toolbar classes for hero actions", async () => {
    const toolbarStyles = await import(
      "../shared/ModalToolbar/ModalToolbar.module.css"
    );

    expect(toolbarStyles.default.toolbar).toBeTruthy();
    expect(toolbarStyles.default.actionButton).toBeTruthy();
  });

  it("adds release to crate from the crate menu", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();

    render(<ReleaseSummaryHero release={release} />, {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenuTrigger")).toBeEnabled();
    });

    await user.click(screen.getByRole("button", { name: "Add to crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("menuitemcheckbox", {
          name: new RegExp(defaultCrateWithCount.name, "i"),
        }),
      ).toBeInTheDocument();
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

  it("removes release from crate when already in crate", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();

    mockApiResponse(
      true,
      mockApi.crate,
      crateWithReleasesResponseFactory.withReleases(defaultCrate, [release]),
      apiError,
    );
    mockApiResponse(
      true,
      mockApi.releaseCrateMembership,
      releaseCrateMembershipResponseFactory.build({
        crateIds: [defaultCrateWithCount.id],
      }),
      apiError,
    );

    render(<ReleaseSummaryHero release={release} />, {
      authInitialState: testAuthenticatedAuthState,
    });

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Manage crates" }),
      ).toHaveAttribute("aria-pressed", "true");
    });

    await user.click(screen.getByRole("button", { name: "Manage crates" }));

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseCrateMenu")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByRole("menuitemcheckbox", {
          name: new RegExp(defaultCrateWithCount.name, "i"),
        }),
      ).toBeInTheDocument();
    });

    await user.click(
      screen.getByRole("menuitemcheckbox", {
        name: new RegExp(defaultCrateWithCount.name, "i"),
      }),
    );

    await waitFor(() => {
      expect(mockApi.removeReleaseFromCrate).toHaveBeenCalledWith(
        defaultCrateWithCount.id,
        String(release.instance_id),
      );
    });
  });

  it("links artist names and title to Discogs", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
        title: "Test Album",
      },
    });
    const artist = release.basic_information.artists[0];
    if (!artist) {
      throw new Error("Expected release to include at least one artist");
    }

    render(<ReleaseSummaryHero release={release} />);

    const artistLink = screen.getByRole("link", { name: artist.name });
    expect(artistLink).toHaveAttribute(
      "href",
      `https://www.discogs.com/artist/${artist.id}`,
    );
    expect(artistLink).toHaveAttribute("target", "_blank");
    expect(artistLink).toHaveAttribute("rel", "noopener noreferrer");

    const titleLink = screen.getByRole("link", { name: "Test Album" });
    expect(titleLink).toHaveTextContent("Test Album");
    expect(titleLink).toHaveAttribute(
      "href",
      `https://www.discogs.com/release/${RELEASE_ID}`,
    );
    expect(titleLink).toHaveAttribute("target", "_blank");
    expect(titleLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("links artist names from Discogs ids when resource_url is missing", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
        artists: [{ name: "Test Artist", id: 4242 }],
      },
    });

    render(<ReleaseSummaryHero release={release} />);

    const artistLink = screen.getByRole("link", { name: "Test Artist" });
    expect(artistLink).toHaveAttribute(
      "href",
      "https://www.discogs.com/artist/4242",
    );
  });

  it("links label name to Discogs in the catalog meta line", () => {
    const label = labelFactory.build({
      name: "Dualtone Music Group",
      catno: "DT-001",
    });
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
        labels: [label],
        year: 2026,
      },
    });

    render(<ReleaseSummaryHero release={release} />);

    const labelLink = screen.getByRole("link", {
      name: "Dualtone Music Group",
    });
    expect(labelLink).toHaveAttribute(
      "href",
      `https://www.discogs.com/label/${label.id}`,
    );
    expect(labelLink).toHaveAttribute("target", "_blank");
    expect(labelLink).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("2026")).toBeInTheDocument();
    expect(screen.getByText("DT-001")).toBeInTheDocument();
  });

  it("shows catalog metadata and community rating on separate lines", async () => {
    setupReleaseDetailMock({
      community: {
        rating: {
          average: 3.42,
          count: 45,
        },
      },
    });

    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 4,
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
        labels: [{ name: "Test Label", catno: "ABC-123" }],
      },
    });

    render(<ReleaseSummaryHero release={release} />);

    expect(screen.getByText("Test Label")).toBeInTheDocument();
    expect(screen.getByText("ABC-123")).toBeInTheDocument();
    expect(screen.queryByText(/You \d\/5/)).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseHeroRatings")).toBeInTheDocument();
      expect(screen.getByText(/3\.42 \(45\)/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Community /)).toBeNull();
  });

  it("shows format and genre/style filter pills below the meta line", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
        labels: [{ name: "Test Label", catno: "ABC-123" }],
        formats: [{ name: "Vinyl", descriptions: ["LP"] }],
        genres: ["Electronic"],
        styles: ["Rock", "Indie Rock"],
      },
    });

    render(<ReleaseSummaryHero release={release} />);

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Electronic" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Rock" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Indie Rock" }),
    ).toBeInTheDocument();
  });

  it("shows the community average without a personal rating", async () => {
    setupReleaseDetailMock({
      community: {
        rating: {
          average: 4.19,
          count: 47,
        },
      },
    });

    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 4,
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
      },
    });

    render(<ReleaseSummaryHero release={release} />);

    expect(screen.queryByText(/You \d\/5/)).toBeNull();

    await waitFor(() => {
      expect(screen.getByText(/4\.19 \(47\)/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Community /)).toBeNull();
  });

  it("shows an editable rating picker for authenticated users", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
      },
    });
    mockApiResponse(
      true,
      mockApi.updateReleaseRating,
      {
        username: "testuser",
        release_id: RELEASE_ID,
        rating: 5,
      },
      apiError,
    );

    render(<ReleaseSummaryHero release={release} />, {
      authInitialState: testAuthenticatedAuthState,
    });

    expect(screen.getByTestId("fmdReleaseRatingPicker")).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: "Rate 3 out of 5" }),
    ).toBeChecked();

    const user = userEvent.setup();
    await user.click(screen.getByRole("radio", { name: "Rate 5 out of 5" }));

    await waitFor(() => {
      expect(mockApi.updateReleaseRating).toHaveBeenCalledWith({
        username: "testuser",
        releaseId: RELEASE_ID,
        rating: 5,
      });
    });
  });

  it("does not show the rating picker when logged out", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      rating: 3,
    });

    render(<ReleaseSummaryHero release={release} />);

    expect(screen.queryByTestId("fmdReleaseRatingPicker")).toBeNull();
  });
});
