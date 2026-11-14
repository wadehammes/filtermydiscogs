import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import type { DiscogsRelease } from "src/types";
import type { RenderResult } from "test-utils";
import { render } from "test-utils";
import { ReleaseSimilarSidebar } from "./ReleaseSimilarSidebar.component";

export type ReleaseSimilarSidebarRenderProps = {
  similarReleases?: DiscogsRelease[];
  totalSimilarMatchCount?: number;
  isLoading?: boolean;
  canShuffleSimilarReleases?: boolean;
  onShuffleSimilarReleases?: () => void;
  onReleaseClick?: (instanceId: string) => void;
  variant?: "aside" | "inline";
};

export class ReleaseSimilarSidebarPageObject extends BasePageObject {
  public testId = "fmdReleaseSimilarSidebar";
  public onShuffleSimilarReleases = jest.fn();
  public onReleaseClick = jest.fn();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private sidebarElement(overrides: ReleaseSimilarSidebarRenderProps = {}) {
    const defaultPeer = releaseFactory.withStyles(["Techno", "House"], {
      instance_id: "similar-peer",
      basic_information: {
        master_id: 900,
        title: "Similar Peer",
      },
    });

    return (
      <ReleaseSimilarSidebar
        similarReleases={[defaultPeer]}
        totalSimilarMatchCount={12}
        canShuffleSimilarReleases
        onShuffleSimilarReleases={this.onShuffleSimilarReleases}
        onReleaseClick={this.onReleaseClick}
        {...overrides}
      />
    );
  }

  renderReleaseSimilarSidebar(
    overrides: ReleaseSimilarSidebarRenderProps = {},
  ): RenderResult {
    return render(this.sidebarElement(overrides));
  }

  rerenderReleaseSimilarSidebar(
    rerender: RenderResult["rerender"],
    overrides: ReleaseSimilarSidebarRenderProps = {},
  ): void {
    rerender(this.sidebarElement(overrides));
  }
}
