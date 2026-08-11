import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { AutocompleteSelectPageObject } from "src/components/AutocompleteSelect/AutocompleteSelect.po";
import { clickFilterOption } from "src/tests/filterControlTestHelpers";
import { screen, waitFor } from "test-utils";

let po: AutocompleteSelectPageObject;

const openAutocomplete = async (name = "Test Autocomplete") => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const trigger = screen.getByRole("combobox", { name });
  await user.click(trigger);

  await waitFor(() => {
    expect(screen.getByRole("combobox", { name })).toHaveAttribute(
      "aria-expanded",
      "true",
    );
  });

  return user;
};

describe("AutocompleteSelect", () => {
  beforeEach(() => {
    po = new AutocompleteSelectPageObject();
  });

  it("renders component root", () => {
    po.renderAutocompleteSelect();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("opens popup with search input", async () => {
    po.renderAutocompleteSelect();

    await openAutocomplete();

    expect(
      screen.getByPlaceholderText("Search test autocomplete..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("filters options when searching", async () => {
    po.renderAutocompleteSelect();
    const user = await openAutocomplete();

    await user.type(
      screen.getByPlaceholderText("Search test autocomplete..."),
      "option 2",
    );

    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const handleChange = jest.fn();
    po.renderAutocompleteSelect({ onChange: handleChange });

    await openAutocomplete();
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith(["option1"]);
  });

  it("shows selected pills for multiple values", () => {
    po.renderAutocompleteSelect({
      value: ["option1", "option2"],
    });

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("clears all selections when Clear is pressed", async () => {
    const handleChange = jest.fn();
    po.renderAutocompleteSelect({
      value: ["option1"],
      clearable: true,
      onChange: handleChange,
    });

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(
      screen.getByRole("button", { name: "Clear Test Autocomplete" }),
    );

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it("removes a selected pill without opening the popup", async () => {
    const handleChange = jest.fn();
    po.renderAutocompleteSelect({
      value: ["option1", "option2"],
      onChange: handleChange,
    });

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    await user.click(screen.getByRole("button", { name: "Remove Option 1" }));

    expect(handleChange).toHaveBeenCalledWith(["option2"]);
    expect(
      screen.getByRole("combobox", { name: "Test Autocomplete" }),
    ).toHaveAttribute("aria-expanded", "false");
  });
});
