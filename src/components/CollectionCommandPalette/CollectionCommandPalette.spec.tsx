import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import userEvent from "@testing-library/user-event";
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

  it("shows Create crate when the hook enables crate creation from preview", () => {
    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.open({
        preview: { matchCount: 12, facts: [] },
        canCreateCrateFromPreview: true,
      }),
    ).renderCollectionCommandPalette();

    expect(
      screen.getByRole("option", { name: "Create crate" }),
    ).toBeInTheDocument();
  });

  it("report command issue closes the palette and opens Sentry feedback with context", async () => {
    const closePalette = jest.fn();
    const user = userEvent.setup();

    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.open({
        query: "techno 2024",
        closePalette,
        preview: { matchCount: 2, facts: [{ label: "Year", value: "2024" }] },
      }),
    ).renderCollectionCommandPalette();

    await user.click(
      screen.getByRole("button", { name: "Report command issue" }),
    );

    expect(closePalette).toHaveBeenCalledTimes(1);
  });

  it("lists Create crate first when the hook prefers crate creation", () => {
    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.open({
        preview: { matchCount: 12, facts: [] },
        canCreateCrateFromPreview: true,
        preferCreateCrateAction: true,
      }),
    ).renderCollectionCommandPalette();

    const options = screen.getAllByRole("option");
    expect(options[0]).toHaveAccessibleName("Create crate");
    expect(options[1]).toHaveAccessibleName("Apply filters");
  });
});
