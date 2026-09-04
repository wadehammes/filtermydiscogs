import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { AutocompleteSelect } from "src/components/AutocompleteSelect/AutocompleteSelect.component";
import { AutocompleteSelectPageObject } from "src/components/AutocompleteSelect/AutocompleteSelect.po";
import {
  clickFilterOption,
  openFilterCombobox,
} from "src/tests/filterControlTestHelpers";
import { screen, waitFor } from "test-utils";

let po: AutocompleteSelectPageObject;

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

    await openFilterCombobox("Test Autocomplete");

    expect(
      screen.getByPlaceholderText("Search test autocomplete..."),
    ).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
  });

  it("filters options when searching", async () => {
    po.renderAutocompleteSelect();
    const user = await openFilterCombobox("Test Autocomplete");

    await user.type(
      screen.getByPlaceholderText("Search test autocomplete..."),
      "option 2",
    );

    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
  });

  it("shows empty message when search has no matches", async () => {
    po.renderAutocompleteSelect();
    const user = await openFilterCombobox("Test Autocomplete");

    await user.type(
      screen.getByPlaceholderText("Search test autocomplete..."),
      "nomatch",
    );

    expect(screen.getByText("No test autocomplete found")).toBeInTheDocument();
    expect(screen.queryByText("Option 1")).not.toBeInTheDocument();
  });

  it("calls onChange when an option is selected", async () => {
    const handleChange = jest.fn();
    po.renderAutocompleteSelect({ onChange: handleChange });

    await openFilterCombobox("Test Autocomplete");
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

  it("reopens when clicking a selected pill after the menu closes", async () => {
    const handleChange = jest.fn();
    const { rerender } = po.renderAutocompleteSelect({
      onChange: handleChange,
    });

    await openFilterCombobox("Test Autocomplete");
    await clickFilterOption("Option 1");

    rerender(
      <AutocompleteSelect
        label={po.label}
        options={po.options}
        onChange={handleChange}
        multiple
        value={["option1"]}
      />,
    );

    await openFilterCombobox("Test Autocomplete");

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("reopens on the first click after selecting a value with clearable enabled", async () => {
    const handleChange = jest.fn();
    const { rerender } = po.renderAutocompleteSelect({
      onChange: handleChange,
      clearable: true,
      showLabel: true,
    });

    await openFilterCombobox("Test Autocomplete");
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith(["option1"]);

    rerender(
      <AutocompleteSelect
        label={po.label}
        options={po.options}
        onChange={handleChange}
        multiple
        clearable
        showLabel
        value={["option1"]}
      />,
    );

    await openFilterCombobox("Test Autocomplete");

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("reopens on the first click after selecting a value", async () => {
    const handleChange = jest.fn();
    const { rerender } = po.renderAutocompleteSelect({
      onChange: handleChange,
    });

    await openFilterCombobox("Test Autocomplete");
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith(["option1"]);

    rerender(
      <AutocompleteSelect
        label={po.label}
        options={po.options}
        onChange={handleChange}
        multiple
        value={["option1"]}
      />,
    );

    await openFilterCombobox("Test Autocomplete");

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("opens on the first click in the pill row when closed", async () => {
    po.renderAutocompleteSelect({ value: ["option1"] });

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const trigger = screen.getByRole("combobox", {
      name: "Test Autocomplete",
    });
    const pillsRow = trigger.querySelector(".scroll");
    expect(pillsRow).toBeTruthy();
    await user.click(pillsRow as Element);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
    expect(
      screen.getByPlaceholderText("Search test autocomplete..."),
    ).toBeInTheDocument();
  });

  it("closes when clicking empty space in the pill row while the menu is open", async () => {
    po.renderAutocompleteSelect({ value: ["option1"] });

    await openFilterCombobox("Test Autocomplete");

    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const trigger = screen.getByRole("combobox", {
      name: "Test Autocomplete",
    });
    const pillsRow = trigger.querySelector(".scroll");
    expect(pillsRow).toBeTruthy();
    await user.click(pillsRow as Element);

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "false");
    });
  });

  it("exposes a scrollable pill row for multi-select values", () => {
    po.renderAutocompleteSelect({
      value: ["option1", "option2", "option3"],
    });

    const scrollRow = screen.getByTestId("fmdFilterPillsScroll");
    const scrollSurface = scrollRow.querySelector(".scroll");

    expect(scrollSurface).not.toBeNull();
    expect(scrollSurface?.className).toContain("pillsContainer");

    Object.defineProperty(scrollSurface, "scrollWidth", {
      configurable: true,
      value: 480,
    });
    Object.defineProperty(scrollSurface, "clientWidth", {
      configurable: true,
      value: 160,
    });

    if (!(scrollSurface instanceof HTMLElement)) {
      throw new Error("Expected pill scroll surface");
    }

    scrollSurface.scrollLeft = 40;
    expect(scrollSurface.scrollLeft).toBe(40);
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
