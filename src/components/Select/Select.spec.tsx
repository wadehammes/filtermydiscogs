import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { SelectPageObject } from "src/components/Select/Select.po";
import { selectOptionFactory } from "src/tests/factories/SelectOption.factory";
import { clickFilterOption } from "src/tests/filterControlTestHelpers";
import { screen, waitFor } from "test-utils";
import Select from "./Select.component";

let po: SelectPageObject;

const openSelect = async (name = "Test Select") => {
  const user = userEvent.setup({ pointerEventsCheck: 0 });
  const trigger = screen.getByRole("combobox", { name });
  await user.click(trigger);

  await waitFor(() => {
    expect(
      screen.getAllByRole("option", { hidden: true }).length,
    ).toBeGreaterThan(0);
  });

  return user;
};

const findOption = (label: string) =>
  screen
    .getAllByRole("option", { hidden: true })
    .find((node) => node.textContent?.includes(label));

const expectSelectClosed = async (name = "Test Select") => {
  await waitFor(
    () => {
      expect(screen.getByRole("combobox", { name })).toHaveAttribute(
        "aria-expanded",
        "false",
      );
    },
    { timeout: 3000 },
  );
};

describe("Select", () => {
  beforeEach(() => {
    po = new SelectPageObject();
  });

  it("renders component root", () => {
    po.renderSelect();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders with label and placeholder", () => {
    const handleChange = jest.fn();
    po.renderSelect({
      onChange: handleChange,
      placeholder: "Choose an option",
    });

    expect(
      screen.getByRole("combobox", { name: "Test Select" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("displays selected value when provided", () => {
    const handleChange = jest.fn();
    po.renderSelect({ value: "option2", onChange: handleChange });

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("opens dropdown when clicked", async () => {
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange });

    await openSelect();

    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("calls onChange when option is selected (single select)", async () => {
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange });

    await openSelect();
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith("option1");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("reopens on the first click after selecting a value", async () => {
    const handleChange = jest.fn();
    const { rerender } = po.renderSelect({ onChange: handleChange });

    await openSelect();
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith("option1");

    rerender(
      <Select
        label="Test Select"
        options={po.options}
        value="option1"
        onChange={handleChange}
      />,
    );

    await openSelect();

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("reopens on the first click after selecting a value when clearable", async () => {
    const handleChange = jest.fn();
    const { rerender } = po.renderSelect({
      onChange: handleChange,
      multiple: true,
      clearable: true,
      showLabel: true,
    });

    await openSelect();
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith(["option1"]);

    rerender(
      <Select
        label="Test Select"
        options={po.options}
        value={["option1"]}
        onChange={handleChange}
        multiple
        clearable
        showLabel
      />,
    );

    await openSelect();

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("closes dropdown after selecting option in single select mode", async () => {
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange });

    await openSelect();
    await clickFilterOption("Option 1");

    await waitFor(() => {
      expect(handleChange).toHaveBeenCalledWith("option1");
    });
    await expectSelectClosed();
  });

  it("supports multiple selection", async () => {
    let selectedValues: string[] = [];
    const handleChange = (value: string | string[]) => {
      selectedValues = Array.isArray(value) ? value : [];
    };

    const renderSelect = () => (
      <Select
        label="Test Select"
        options={po.options}
        value={selectedValues}
        onChange={handleChange}
        multiple={true}
      />
    );

    const { rerender } = po.renderSelect({
      multiple: true,
      onChange: handleChange,
      value: selectedValues,
    });

    await openSelect();
    await clickFilterOption("Option 1");

    expect(selectedValues).toEqual(["option1"]);

    rerender(renderSelect());

    const option2 = findOption("Option 2");
    expect(option2).toBeInTheDocument();
    if (option2) {
      const user = userEvent.setup({ pointerEventsCheck: 0 });
      await user.click(option2);
    }

    expect(selectedValues).toEqual(["option1", "option2"]);
  });

  it("allows deselecting options in multiple mode", async () => {
    const handleChange = jest.fn();
    po.renderSelect({
      value: ["option1", "option2"],
      onChange: handleChange,
      multiple: true,
    });

    await openSelect();
    await clickFilterOption("Option 1");

    expect(handleChange).toHaveBeenCalledWith(["option2"]);
  });

  it("displays selected options in multiple mode", () => {
    const handleChange = jest.fn();
    po.renderSelect({
      value: ["option1", "option3"],
      onChange: handleChange,
      multiple: true,
    });

    expect(screen.getByText("option1, option3")).toBeInTheDocument();
  });

  it("shows checkmark for selected options", async () => {
    const handleChange = jest.fn();
    po.renderSelect({ value: "option2", onChange: handleChange });

    await openSelect();

    const option2 = findOption("Option 2");
    expect(option2).toBeInTheDocument();
    const checkmark = option2?.querySelector("svg");
    expect(checkmark).toBeInTheDocument();
  });

  it("displays default badge for default option", () => {
    const handleChange = jest.fn();
    const optionsWithDefault = [
      selectOptionFactory.build({
        value: "option1",
        label: "Option 1",
        isDefault: true,
      }),
      selectOptionFactory.build({ value: "option2", label: "Option 2" }),
    ];

    po.renderSelect({
      options: optionsWithDefault,
      value: "option1",
      onChange: handleChange,
    });

    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("handles keyboard navigation - Enter opens dropdown", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange });

    const trigger = screen.getByRole("combobox", { name: "Test Select" });
    trigger.focus();
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { hidden: true }).length,
      ).toBeGreaterThan(0);
    });
  });

  it("handles keyboard navigation - Arrow keys keep the list open", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    po.renderSelect({ onChange: jest.fn() });

    await openSelect();

    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowUp}");

    expect(
      screen.getByRole("combobox", { name: "Test Select" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByRole("option", { hidden: true }).length).toBe(3);
  });

  it("handles keyboard navigation - Escape closes dropdown", async () => {
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange });

    await openSelect();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Test Select" }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    screen.getByRole("combobox", { name: "Test Select" }).focus();
    await user.keyboard("{Escape}");

    await expectSelectClosed();
  });

  it("closes dropdown when clicking outside", async () => {
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange });

    const user = await openSelect();

    await waitFor(() => {
      expect(
        screen.getByRole("combobox", { name: "Test Select" }),
      ).toHaveAttribute("aria-expanded", "true");
    });

    await user.pointer({ keys: "[MouseLeft]", target: document.body });

    await expectSelectClosed();
  });

  it("is disabled when disabled prop is true", () => {
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange, disabled: true });

    const trigger = screen.getByRole("combobox", { name: "Test Select" });
    expect(trigger).toBeDisabled();
  });

  it("does not open dropdown when disabled", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    po.renderSelect({ onChange: handleChange, disabled: true });

    const trigger = screen.getByRole("combobox", { name: "Test Select" });
    await user.click(trigger);

    expect(screen.queryAllByRole("option", { hidden: true })).toHaveLength(0);
  });

  it("handles empty options array", () => {
    const handleChange = jest.fn();
    po.renderSelect({ options: [], onChange: handleChange });

    const trigger = screen.getByRole("combobox", { name: "Test Select" });
    expect(trigger).toBeInTheDocument();
  });

  it("clears multi-select values when clearable and Clear is pressed", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    po.renderSelect({
      onChange: handleChange,
      multiple: true,
      clearable: true,
      showLabel: true,
      value: ["option1", "option2"],
    });

    await user.click(screen.getByRole("button", { name: "Clear Test Select" }));

    expect(handleChange).toHaveBeenCalledWith([]);
  });

  it("does not render clear control until multi-select has selections", () => {
    const handleChange = jest.fn();
    const { container } = po.renderSelect({
      onChange: handleChange,
      multiple: true,
      clearable: true,
      showLabel: true,
      value: [],
    });

    expect(
      container.querySelector('[aria-label="Clear Test Select"]'),
    ).not.toBeInTheDocument();
  });
});
