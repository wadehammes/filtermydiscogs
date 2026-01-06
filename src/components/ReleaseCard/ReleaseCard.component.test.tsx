import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mocked } from "jest-mock";
import { fetchDiscogsRelease } from "src/api/helpers";
import { useCrate } from "src/context/crate.context";
import {
  FiltersActionTypes,
  SortValues,
  useFilters,
} from "src/context/filters.context";
import { artistFactory } from "src/tests/factories/Artist.factory";
import { basicInformationFactory } from "src/tests/factories/BasicInformation.factory";
import { formatFactory } from "src/tests/factories/Format.factory";
import { labelFactory } from "src/tests/factories/Label.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render } from "test-utils";
import { ReleaseCard } from "./ReleaseCard.component";

jest.mock("src/context/crate.context");
jest.mock("src/context/filters.context");
jest.mock("src/api/helpers");
jest.mock("src/analytics/analytics", () => ({
  trackEvent: jest.fn(),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    // biome-ignore lint/performance/noImgElement: Test mock component
    return <img src={props.src} alt={props.alt} />;
  },
}));

const mockUseCrate = mocked(useCrate);
const mockUseFilters = mocked(useFilters);
const mockFetchDiscogsRelease = mocked(fetchDiscogsRelease);

describe("ReleaseCard", () => {
  const mockAddToCrate = jest.fn();
  const mockRemoveFromCrate = jest.fn();
  const mockIsInCrate = jest.fn();
  const mockOpenDrawer = jest.fn();
  const mockFiltersDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    window.open = jest.fn();

    mockUseCrate.mockReturnValue({
      addToCrate: mockAddToCrate,
      removeFromCrate: mockRemoveFromCrate,
      isInCrate: mockIsInCrate,
      openDrawer: mockOpenDrawer,
      crates: [],
      activeCrateId: null,
      selectedReleases: [],
      toggleDrawer: jest.fn(),
      closeDrawer: jest.fn(),
      selectCrate: jest.fn(),
      createCrate: jest.fn(),
      updateCrate: jest.fn(),
      deleteCrate: jest.fn(),
      clearCrate: jest.fn(),
      isDrawerOpen: false,
      isLoading: false,
      isUpdatingCrate: false,
      isDeletingCrate: false,
    });

    mockUseFilters.mockReturnValue({
      state: {
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        searchQuery: "",
        isRandomMode: false,
        randomRelease: null,
        availableStyles: [],
        availableYears: [],
        availableFormats: [],
        filteredReleases: [],
        allReleases: [],
        isSearching: false,
      },
      dispatch: mockFiltersDispatch,
    });

    mockFetchDiscogsRelease.mockResolvedValue({
      uri: "https://www.discogs.com/release/123",
    });

    mockIsInCrate.mockImplementation(() => false);
  });

  it("renders release information", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        title: "Test Album",
        artists: [artistFactory.build({ name: "Test Artist" })],
        year: 2020,
        labels: [labelFactory.build({ name: "Test Label" })],
      }),
    });

    render(<ReleaseCard release={release} />);

    expect(screen.getByText("Test Artist - Test Album")).toBeInTheDocument();
    expect(screen.getByText("Test Label • 2020")).toBeInTheDocument();
  });

  it("displays date added when available", () => {
    const release = releaseFactory.build({
      date_added: "2023-01-15T00:00:00Z",
      basic_information: basicInformationFactory.build(),
    });

    render(<ReleaseCard release={release} />);

    expect(screen.getByText(/Date Added:/)).toBeInTheDocument();
  });

  it("displays style pills", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock", "Pop"],
      }),
    });

    render(<ReleaseCard release={release} />);

    expect(
      screen.getByRole("button", { name: "Filter by Rock style" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by Pop style" }),
    ).toBeInTheDocument();
  });

  it("displays format pills", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [
          formatFactory.build({ name: "Vinyl" }),
          formatFactory.build({ name: "LP" }),
        ],
      }),
    });

    render(<ReleaseCard release={release} />);

    expect(
      screen.getByRole("button", { name: "Filter by Vinyl format" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Filter by LP format" }),
    ).toBeInTheDocument();
  });

  it("calls addToCrate when crate button is clicked and release is not in crate", async () => {
    const release = releaseFactory.build();
    mockIsInCrate.mockImplementation(() => false);
    const user = userEvent.setup();

    render(<ReleaseCard release={release} />);

    const crateButton = screen.getByRole("button", { name: "Add to crate" });
    await user.click(crateButton);

    expect(mockAddToCrate).toHaveBeenCalledWith(release);
    expect(mockOpenDrawer).toHaveBeenCalled();
  });

  it("calls removeFromCrate when crate button is clicked and release is in crate", async () => {
    const release = releaseFactory.build();
    mockIsInCrate.mockImplementation(() => true);
    const user = userEvent.setup();

    render(<ReleaseCard release={release} />);

    const crateButton = screen.getByRole("button", {
      name: "Remove from crate",
    });
    await user.click(crateButton);

    expect(mockRemoveFromCrate).toHaveBeenCalledWith(release.instance_id);
    expect(mockAddToCrate).not.toHaveBeenCalled();
  });

  it("applies highlighted class when isHighlighted is true", () => {
    const release = releaseFactory.build();
    const { container } = render(
      <ReleaseCard release={release} isHighlighted={true} />,
    );

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("highlighted");
  });

  it("applies inCrate class when release is in crate", () => {
    const release = releaseFactory.build();
    mockIsInCrate.mockImplementation(() => true);
    const { container } = render(<ReleaseCard release={release} />);

    const card = container.querySelector(".releaseCard");
    expect(card?.className).toContain("inCrate");
  });

  it("calls toggleStyle when style pill is clicked", async () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });
    const user = userEvent.setup();

    render(<ReleaseCard release={release} />);

    const stylePill = screen.getByRole("button", {
      name: "Filter by Rock style",
    });
    await user.click(stylePill);

    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: FiltersActionTypes.ToggleStyle,
      payload: "Rock",
    });
  });

  it("calls toggleFormat when format pill is clicked", async () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        formats: [formatFactory.build({ name: "Vinyl" })],
      }),
    });
    const user = userEvent.setup();

    render(<ReleaseCard release={release} />);

    const formatPill = screen.getByRole("button", {
      name: "Filter by Vinyl format",
    });
    await user.click(formatPill);

    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: FiltersActionTypes.ToggleFormat,
      payload: "Vinyl",
    });
  });

  it("toggles random mode when style pill is clicked in random mode", async () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        styles: ["Rock"],
      }),
    });
    const onExitRandomMode = jest.fn();
    const user = userEvent.setup();

    mockUseFilters.mockReturnValue({
      state: {
        selectedStyles: [],
        selectedYears: [],
        selectedFormats: [],
        selectedSort: SortValues.DateAddedNew,
        styleOperator: "OR",
        searchQuery: "",
        isRandomMode: true,
        randomRelease: null,
        availableStyles: [],
        availableYears: [],
        availableFormats: [],
        filteredReleases: [],
        allReleases: [],
        isSearching: false,
      },
      dispatch: mockFiltersDispatch,
    });

    render(
      <ReleaseCard release={release} onExitRandomMode={onExitRandomMode} />,
    );

    const stylePill = screen.getByRole("button", {
      name: "Filter by Rock style",
    });
    await user.click(stylePill);

    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: FiltersActionTypes.ToggleRandomMode,
      payload: undefined,
    });
    expect(onExitRandomMode).toHaveBeenCalled();
  });

  it("shows loading overlay when fetching release data", async () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        resource_url: "https://api.discogs.com/releases/123",
      }),
    });
    const user = userEvent.setup();

    mockFetchDiscogsRelease.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({ uri: "https://www.discogs.com/release/123" });
          }, 100);
        }),
    );

    render(<ReleaseCard release={release} />);

    const discogsButton = screen.getByRole("button", {
      name: "View on Discogs",
    });
    await user.click(discogsButton);

    await waitFor(() => {
      expect(
        screen.getByText("Fetching Discogs Release URL"),
      ).toBeInTheDocument();
    });
  });

  it("opens release URL when Discogs button is clicked and data is available", async () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        resource_url: "https://api.discogs.com/releases/123",
      }),
    });
    const user = userEvent.setup();

    mockFetchDiscogsRelease.mockResolvedValue({
      uri: "https://www.discogs.com/release/123",
    });

    render(<ReleaseCard release={release} />);

    const discogsButton = screen.getByRole("button", {
      name: "View on Discogs",
    });
    await user.click(discogsButton);

    await waitFor(() => {
      expect(window.open).toHaveBeenCalledWith(
        "https://www.discogs.com/release/123",
        "_blank",
        "noopener,noreferrer",
      );
    });
  });

  it("uses cover_image when available", () => {
    const release = releaseFactory.build({
      basic_information: basicInformationFactory.build({
        cover_image: "https://example.com/cover.jpg",
        thumb: "https://example.com/thumb.jpg",
      }),
    });

    render(<ReleaseCard release={release} />);

    const image = screen.getByAltText(release.basic_information.title);
    expect(image).toHaveAttribute("src", expect.stringContaining("cover.jpg"));
  });

  it("falls back to thumb when cover_image is not available", () => {
    const basicInfo = basicInformationFactory.build({
      thumb: "https://example.com/thumb.jpg",
      cover_image: "",
    });

    const release = releaseFactory.build({
      basic_information: basicInfo,
    });

    render(<ReleaseCard release={release} />);

    const image = screen.getByAltText(release.basic_information.title);
    expect(image).toHaveAttribute("src", expect.stringContaining("thumb.jpg"));
  });
});
