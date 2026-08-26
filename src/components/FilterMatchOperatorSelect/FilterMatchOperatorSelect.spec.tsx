import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { FilterMatchOperatorSelectPageObject } from "src/components/FilterMatchOperatorSelect/FilterMatchOperatorSelect.po";
import { screen } from "test-utils";

describe("FilterMatchOperatorSelect", () => {
  let po: FilterMatchOperatorSelectPageObject;

  beforeEach(() => {
    po = new FilterMatchOperatorSelectPageObject();
    jest.clearAllMocks();
  });

  it("renders nothing when fewer than two values are selected", () => {
    const { container } = po.renderFilterMatchOperatorSelect({
      selectedCount: 1,
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the match operator select when multiple values are selected", () => {
    po.renderFilterMatchOperatorSelect({
      selectedCount: 2,
      showLabel: true,
    });

    expect(screen.getByText("Match")).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Match" })).toBeInTheDocument();
  });
});
