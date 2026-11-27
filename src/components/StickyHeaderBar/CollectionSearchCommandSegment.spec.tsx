import { beforeEach, describe, expect, it } from "@jest/globals";
import { CollectionSearchCommandSegmentPageObject } from "src/components/StickyHeaderBar/CollectionSearchCommandSegment.po";
import { screen } from "test-utils";

let po: CollectionSearchCommandSegmentPageObject;

describe("CollectionSearchCommandSegment", () => {
  beforeEach(() => {
    po = new CollectionSearchCommandSegmentPageObject();
    po.mockOpenCollectionCommandPalette.mockClear();
  });

  it("shows an Ask chip that opens the collection command palette", async () => {
    po.renderCollectionSearchCommandSegment();

    expect(
      screen.getByTestId("fmdCollectionSearchCommandSegment"),
    ).toBeInTheDocument();

    const chip = screen.getByTestId("fmdCollectionCommandOpenChip");
    expect(chip).toHaveTextContent("Ask");
    chip.click();

    expect(po.mockOpenCollectionCommandPalette).toHaveBeenCalledTimes(1);
  });
});
