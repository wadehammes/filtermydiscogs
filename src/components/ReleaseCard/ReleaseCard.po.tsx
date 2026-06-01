import { mocked } from "jest-mock";
import * as apiHelpers from "src/api/helpers";
import { useCrate } from "src/context/crate.context";
import * as filterAtoms from "src/hooks/useFilterAtoms.hook";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/basePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { mockApiResponse } from "src/tests/mocks/mockApiResponse";
import type { RenderResult } from "src/tests/utils/test-utils";
import { render } from "src/tests/utils/test-utils";
import type { DiscogsRelease, ReleaseCardProps } from "src/types";
import { ReleaseCard } from "./ReleaseCard.component";

jest.mock("src/api/helpers");
jest.mock("src/context/crate.context");
jest.mock("src/hooks/useFilterAtoms.hook");
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

const mockApi = mocked(apiHelpers);
const mockUseCrate = mocked(useCrate);
const mockUseSelectedStyles = mocked(filterAtoms.useSelectedStyles);
const mockUseSelectedFormats = mocked(filterAtoms.useSelectedFormats);
const mockUseFiltersDispatch = mocked(filterAtoms.useFiltersDispatch);
const mockUseIsRandomMode = mocked(filterAtoms.useIsRandomMode);

export type ReleaseCardRenderProps = Partial<
  Omit<ReleaseCardProps, "release">
> & {
  release?: DiscogsRelease;
};

export class ReleaseCardPageObject extends BasePageObject {
  public testId = "fmdReleaseCard";
  public mockApi = mockApi.fetchDiscogsRelease;
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

    mockUseSelectedStyles.mockReturnValue([]);
    mockUseSelectedFormats.mockReturnValue([]);
    mockUseFiltersDispatch.mockReturnValue(this.filtersDispatch);
    mockUseIsRandomMode.mockReturnValue(false);

    mockApiResponse(
      true,
      this.mockApi,
      { uri: "https://www.discogs.com/release/123" },
      new Error("Failed to fetch release"),
    );

    this.isInCrate.mockImplementation(() => false);
  }

  mockRandomModeFilters() {
    mockUseIsRandomMode.mockReturnValue(true);
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
