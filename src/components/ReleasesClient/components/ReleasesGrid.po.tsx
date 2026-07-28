import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { testAuthenticatedAuthState } from "src/tests/utils/testAuthStates";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleasesGrid } from "./ReleasesGrid.component";

jest.mock("next/dynamic", () => ({
  __esModule: true,
  default:
    () =>
    ({ releases }: { releases: DiscogsRelease[] }) => (
      <div data-testid="fmdReleasesTable">{`${releases.length} table rows`}</div>
    ),
}));

jest.mock("src/components/ReleasesTable/ReleasesTable.component", () => ({
  ReleasesTable: ({ releases }: { releases: DiscogsRelease[] }) => (
    <div data-testid="fmdReleasesTable">{`${releases.length} table rows`}</div>
  ),
}));

export type ReleasesGridRenderProps = {
  releases?: DiscogsRelease[];
  view?: "card" | "list" | "random";
  isMobile?: boolean;
  isRandomMode?: boolean;
  onExitRandomMode?: () => void;
  onRandomClick?: () => void;
  onReleaseClick?: (instanceId: string) => void;
  randomRelease?: DiscogsRelease | null;
};

export class ReleasesGridPageObject extends BasePageObject {
  public desktopCardTestId = "fmdReleaseCard";
  public mobileCardTestId = "fmdMobileReleaseCard";
  public tableTestId = "fmdReleasesTable";
  public onReleaseClick = jest.fn();
  public onExitRandomMode = jest.fn();
  public onRandomClick = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private releasesGridElement(overrides: ReleasesGridRenderProps = {}) {
    const {
      releases = releaseFactory.buildList(2),
      view = "card",
      isMobile = false,
      isRandomMode = false,
      onExitRandomMode,
      onRandomClick,
      onReleaseClick,
      randomRelease = null,
    } = overrides;

    return (
      <ReleasesGrid
        releases={releases}
        view={view}
        isMobile={isMobile}
        isRandomMode={isRandomMode}
        onExitRandomMode={onExitRandomMode ?? this.onExitRandomMode}
        onRandomClick={onRandomClick ?? this.onRandomClick}
        onReleaseClick={onReleaseClick ?? this.onReleaseClick}
        randomRelease={randomRelease}
      />
    );
  }

  renderReleasesGrid(overrides: ReleasesGridRenderProps = {}): RenderResult {
    return render(this.releasesGridElement(overrides), {
      authInitialState: testAuthenticatedAuthState,
    });
  }
}
