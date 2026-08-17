import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import * as apiHelpers from "src/api/helpers";
import { ReleaseSummaryHero } from "src/components/ReleaseModal/ReleaseSummaryHero.component";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import { setupDefaultCrateApiMocks } from "src/tests/mocks/setupDefaultCrateApiMocks";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import { render, screen, waitFor } from "test-utils";

const mockAddToCrate = jest.fn();
const mockRemoveFromCrate = jest.fn();
const mockIsInCrate = jest.fn(() => false);
const mockOpenDrawer = jest.fn();
const mockUseMediaQuery = jest.fn(() => false);

const mockApi = jest.mocked(apiHelpers);
const apiError = new Error("API request failed");
const RELEASE_ID = 249504;

jest.mock("src/context/crate.context", () => ({
  useCrate: () => ({
    addToCrate: mockAddToCrate,
    removeFromCrate: mockRemoveFromCrate,
    isInCrate: mockIsInCrate,
    openDrawer: mockOpenDrawer,
  }),
}));

jest.mock("src/hooks/useMediaQuery.hook", () => ({
  useMediaQuery: () => mockUseMediaQuery(),
}));

jest.mock("src/api/helpers");

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
    mockApi.fetchDiscogsRelease,
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
    mockIsInCrate.mockReturnValue(false);
    mockUseMediaQuery.mockReturnValue(false);
    setupDefaultCrateApiMocks(mockApi);
    setupReleaseDetailMock();
  });

  it("exports shared modal toolbar classes for hero actions", async () => {
    const toolbarStyles = await import(
      "../shared/ModalToolbar/ModalToolbar.module.css"
    );

    expect(toolbarStyles.default.toolbar).toBeTruthy();
    expect(toolbarStyles.default.actionButton).toBeTruthy();
  });

  it("adds release to crate and opens drawer on desktop", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    expect(mockAddToCrate).toHaveBeenCalledWith(release);
    expect(mockOpenDrawer).toHaveBeenCalled();
    expect(mockRemoveFromCrate).not.toHaveBeenCalled();
  });

  it("removes release from crate when already in crate", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();
    mockIsInCrate.mockReturnValue(true);

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    expect(
      screen.getByRole("button", { name: "Remove from crate" }),
    ).toHaveAttribute("aria-pressed", "true");

    await user.click(screen.getByRole("button", { name: "Remove from crate" }));

    expect(mockRemoveFromCrate).toHaveBeenCalledWith(release.instance_id);
    expect(mockAddToCrate).not.toHaveBeenCalled();
    expect(mockOpenDrawer).not.toHaveBeenCalled();
  });

  it("does not open drawer on mobile when adding to crate", async () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID);
    const user = userEvent.setup();
    mockUseMediaQuery.mockReturnValue(true);

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    await user.click(screen.getByRole("button", { name: "Add to crate" }));

    expect(mockAddToCrate).toHaveBeenCalledWith(release);
    expect(mockOpenDrawer).not.toHaveBeenCalled();
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

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    expect(
      screen.getByText(/Test Label · \d{4} · ABC-123/),
    ).toBeInTheDocument();
    expect(screen.queryByText(/You \d\/5/)).toBeNull();

    await waitFor(() => {
      expect(screen.getByTestId("fmdReleaseHeroRatings")).toBeInTheDocument();
      expect(screen.getByText(/3\.4 \(45\)/)).toBeInTheDocument();
    });

    expect(screen.queryByText(/^Community /)).toBeNull();
  });

  it("shows format and style filter pills below the meta line", () => {
    const release = releaseFactory.withResourceUrl(RELEASE_ID, {
      basic_information: {
        ...releaseFactory.withResourceUrl(RELEASE_ID).basic_information,
        id: RELEASE_ID,
        labels: [{ name: "Test Label", catno: "ABC-123" }],
        formats: [{ name: "Vinyl", descriptions: ["LP"] }],
        styles: ["Rock", "Indie Rock"],
      },
    });

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Rock style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Indie Rock style" }),
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

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    expect(screen.queryByText(/You \d\/5/)).toBeNull();

    await waitFor(() => {
      expect(screen.getByText(/4\.2 \(47\)/)).toBeInTheDocument();
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
      includeCrate: false,
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

    render(<ReleaseSummaryHero release={release} />, { includeCrate: false });

    expect(screen.queryByTestId("fmdReleaseRatingPicker")).toBeNull();
  });
});
