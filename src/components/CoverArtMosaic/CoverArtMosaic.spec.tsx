import { beforeEach, describe, expect, it } from "@jest/globals";
import { CoverArtMosaicPageObject } from "src/components/CoverArtMosaic/CoverArtMosaic.po";
import { screen } from "test-utils";

let po: CoverArtMosaicPageObject;

describe("CoverArtMosaic", () => {
  beforeEach(() => {
    po = new CoverArtMosaicPageObject();
  });

  it("renders CoverArtMosaic", () => {
    po.renderCoverArtMosaic();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });
});
