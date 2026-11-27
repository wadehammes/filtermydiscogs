import type { RenderResult } from "@testing-library/react";
import { CollectionCommandPalette } from "src/components/CollectionCommandPalette/CollectionCommandPalette.component";
import { useCollectionCommandPalette } from "src/hooks/useCollectionCommandPalette.hook";
import {
  BasePageObject,
  type BasePageObjectProps,
} from "src/tests/BasePageObject.po";
import {
  type UseCollectionCommandPaletteReturn,
  useCollectionCommandPaletteReturnFactory,
} from "src/tests/factories/UseCollectionCommandPaletteReturn.factory";
import { render } from "test-utils";

jest.mock("src/hooks/useCollectionCommandPalette.hook", () => ({
  useCollectionCommandPalette: jest.fn(),
}));

export const mockUseCollectionCommandPalette = jest.mocked(
  useCollectionCommandPalette,
);

export class CollectionCommandPalettePageObject extends BasePageObject {
  public testId = "fmdCollectionCommandPalette";

  public inputTestId = "fmdCollectionCommandInput";

  mockUseCollectionCommandPalette = mockUseCollectionCommandPalette;

  private hookReturn = useCollectionCommandPaletteReturnFactory.open();

  constructor(props: BasePageObjectProps = {}) {
    super(props);
  }

  withHookReturn(
    hookReturn: UseCollectionCommandPaletteReturn,
  ): CollectionCommandPalettePageObject {
    this.hookReturn = hookReturn;
    return this;
  }

  renderCollectionCommandPalette(): RenderResult {
    this.mockUseCollectionCommandPalette.mockReturnValue(this.hookReturn);
    return render(<CollectionCommandPalette />);
  }

  rerenderCollectionCommandPalette(rerender: RenderResult["rerender"]): void {
    rerender(<CollectionCommandPalette />);
  }
}
