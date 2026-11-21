import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CollectionRadioPlayButtonPageObject } from "src/components/CollectionRadioPlayButton/CollectionRadioPlayButton.po";
import { screen } from "test-utils";

const mockStartCollectionRadio = jest.fn();

jest.mock("src/hooks/useCollectionRadioPlayback.hook", () => ({
  useCollectionRadioPlayback: () => ({
    startCollectionRadio: mockStartCollectionRadio,
    isStarting: false,
    filteredReleaseCount: 2,
  }),
}));

let po: CollectionRadioPlayButtonPageObject;

describe("CollectionRadioPlayButton", () => {
  beforeEach(() => {
    mockStartCollectionRadio.mockReset();
    po = new CollectionRadioPlayButtonPageObject();
  });

  it("does not render when filters and saved views are inactive", () => {
    po.renderCollectionRadioPlayButton();

    expect(screen.queryByTestId(po.testId)).not.toBeInTheDocument();
  });

  it("renders when collection filters are active", () => {
    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Rock"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Play collection radio" }),
    ).toBeEnabled();
  });

  it("starts collection radio when the play control is pressed", async () => {
    const user = userEvent.setup();

    po.renderCollectionRadioPlayButton({
      sessionFilters: {
        selectedStyles: ["Jazz"],
        selectedYears: [],
        selectedFormats: [],
        searchQuery: "",
      },
    });

    await user.click(
      screen.getByRole("button", { name: "Play collection radio" }),
    );

    expect(mockStartCollectionRadio).toHaveBeenCalledTimes(1);
  });
});
