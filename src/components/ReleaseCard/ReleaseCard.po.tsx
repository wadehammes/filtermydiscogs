import type { RenderResult } from "@testing-library/react";
import { mocked } from "jest-mock";
import { fetchDiscogsRelease } from "src/api/helpers";
import { useCrate } from "src/context/crate.context";
import { SortValues, useFilters } from "src/context/filters.context";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
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
    // biome-ignore lint/performance/noImgElement: Test mock component
    return <img src={props.src} alt={props.alt} />;
  },
}));

export const mockUseCrate = mocked(useCrate);
export const mockUseFilters = mocked(useFilters);
export const mockFetchDiscogsRelease = mocked(fetchDiscogsRelease);

export type ReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class ReleaseCardPageObject extends BasePageObject {
  public testId = "fmdReleaseCard";
  public addToCrate = jest.fn();
  public removeFromCrate = jest.fn();
  public isInCrate = jest.fn();
  public openDrawer = jest.fn();
  public filtersDispatch = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    this.setupMocks();
  }

  setupMocks() {
    jest.clearAllMocks();
    window.open = jest.fn();

    mockUseCrate.mockReturnValue({
      addToCrate: this.addToCrate,
      removeFromCrate: this.removeFromCrate,
      isInCrate: this.isInCrate,
      openDrawer: this.openDrawer,
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
      isLoadingCrate: false,
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
      dispatch: this.filtersDispatch,
    });

    mockFetchDiscogsRelease.mockResolvedValue({
      uri: "https://www.discogs.com/release/123",
    });

    this.isInCrate.mockImplementation(() => false);
  }

  mockRandomModeFilters() {
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
      dispatch: this.filtersDispatch,
    });
  }

  private releaseCardElement(overrides: ReleaseCardRenderProps = {}) {
    return (
      <ReleaseCard
        release={overrides.release ?? releaseFactory.withDisplayDefaults()}
        {...overrides}
      />
    );
  }

  renderReleaseCard(overrides: ReleaseCardRenderProps = {}): RenderResult {
    return render(this.releaseCardElement(overrides));
  }
}
