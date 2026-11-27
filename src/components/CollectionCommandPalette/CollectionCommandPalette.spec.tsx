import { beforeEach, describe, expect, it } from "@jest/globals";
import { CollectionCommandPalettePageObject } from "src/components/CollectionCommandPalette/CollectionCommandPalette.po";
import { COLLECTION_COMMAND_PROMPT_MAX_LENGTH } from "src/constants/collectionCommand.constants";
import { useCollectionCommandPaletteReturnFactory } from "src/tests/factories/UseCollectionCommandPaletteReturn.factory";
import { screen } from "test-utils";

let po: CollectionCommandPalettePageObject;

describe("CollectionCommandPalette", () => {
  beforeEach(() => {
    po = new CollectionCommandPalettePageObject().withHookReturn(
      useCollectionCommandPaletteReturnFactory.open(),
    );
  });

  it("renders CollectionCommandPalette when open", () => {
    po.renderCollectionCommandPalette();

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("caps command input length to the interpret API max", () => {
    po.renderCollectionCommandPalette();

    expect(screen.getByTestId("fmdCollectionCommandInput")).toHaveAttribute(
      "maxLength",
      String(COLLECTION_COMMAND_PROMPT_MAX_LENGTH),
    );
  });
});
