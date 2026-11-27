import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { MobileMenuHeaderPageObject } from "src/components/StickyHeaderBar/MobileMenuHeader.po";
import { screen } from "test-utils";

let po: MobileMenuHeaderPageObject;

describe("MobileMenuHeader", () => {
  beforeEach(() => {
    po = new MobileMenuHeaderPageObject();
  });

  it("shows an Ask control that opens the collection command palette", async () => {
    const user = userEvent.setup();
    const onCollectionCommandClick = jest.fn();

    po.renderMobileMenuHeader({
      onCollectionCommandClick,
      collectionCommandAriaLabel:
        "Open collection command. Ask your collection in plain English (⌘⇧K)",
    });

    const askButton = screen.getByTestId(po.collectionCommandTestId);
    expect(askButton).toHaveAttribute(
      "aria-label",
      "Open collection command. Ask your collection in plain English (⌘⇧K)",
    );

    await user.click(askButton);

    expect(onCollectionCommandClick).toHaveBeenCalledTimes(1);
  });

  it("hides the Ask control when collection command entry is disabled", () => {
    po.renderMobileMenuHeader({ shouldShowCollectionCommand: false });

    expect(
      screen.queryByTestId(po.collectionCommandTestId),
    ).not.toBeInTheDocument();
  });
});
