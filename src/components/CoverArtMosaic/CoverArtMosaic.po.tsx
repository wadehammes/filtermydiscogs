import type { RenderResult } from "@testing-library/react";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import { render } from "test-utils";
import {
  CoverArtMosaic,
  type CoverArtMosaicProps,
} from "./CoverArtMosaic.component";

export type CoverArtMosaicRenderProps = Partial<CoverArtMosaicProps>;

export class CoverArtMosaicPageObject extends BasePageObject {
  public testId = "fmdCoverArtMosaic";

  constructor(props: BasePageObjectProps = {}) {
    super(props);
    jest.resetAllMocks();
  }

  private coverArtMosaicElement(overrides: CoverArtMosaicRenderProps = {}) {
    return <CoverArtMosaic thumbUrls={[]} {...overrides} />;
  }

  renderCoverArtMosaic(
    overrides: CoverArtMosaicRenderProps = {},
  ): RenderResult {
    return render(this.coverArtMosaicElement(overrides));
  }
}
