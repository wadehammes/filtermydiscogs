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

  it("shows example prompts when history is empty", () => {
    const examplePrompts = [
      "Save a view for Techno Vinyl",
      "Make a crate from what's showing",
      "Show only Vinyl for Techno",
    ];

    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.open({ examplePrompts }),
    ).renderCollectionCommandPalette();

    expect(
      screen.getByTestId("fmdCollectionCommandExamples"),
    ).toBeInTheDocument();
    for (const prompt of examplePrompts) {
      expect(screen.getByRole("button", { name: prompt })).toBeInTheDocument();
    }
  });

  it("calls startOver when Start over is pressed", async () => {
    const startOver = jest.fn();
    const user = userEvent.setup();

    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.withQuery("techno vinyl", {
        startOver,
      }),
    ).renderCollectionCommandPalette();

    await user.click(screen.getByRole("button", { name: "Start over" }));

    expect(startOver).toHaveBeenCalledTimes(1);
  });

  it("hides Start over when the command input and preview are empty", () => {
    po.renderCollectionCommandPalette();

    expect(
      screen.queryByRole("button", { name: "Start over" }),
    ).not.toBeInTheDocument();
  });

  it("calls clearPromptHistory when Clear recent is pressed", async () => {
    const clearPromptHistory = jest.fn();
    const user = userEvent.setup();

    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.withPromptHistory(
        ["Ambient for coding"],
        { clearPromptHistory },
      ),
    ).renderCollectionCommandPalette();

    await user.click(screen.getByRole("button", { name: "Clear recent" }));

    expect(clearPromptHistory).toHaveBeenCalledTimes(1);
  });

  it("hides Clear recent while Run or preview actions are showing", () => {
    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.withPromptHistory(
        ["Ambient for coding"],
        { query: "techno", preview: { matchCount: 5, facts: [] } },
      ),
    ).renderCollectionCommandPalette();

    expect(
      screen.queryByRole("button", { name: "Clear recent" }),
    ).not.toBeInTheDocument();
  });

  it("shows recent prompts instead of examples when history exists", () => {
    po.withHookReturn(
      useCollectionCommandPaletteReturnFactory.withPromptHistory([
        "Ambient for coding",
      ]),
    ).renderCollectionCommandPalette();

    expect(
      screen.queryByTestId("fmdCollectionCommandExamples"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Clear recent" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ambient for coding" }),
    ).toBeInTheDocument();
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
