import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "test-utils";
import { Select } from "./Select.component";

describe("Select", () => {
  const options = [
    { value: "option1", label: "Option 1" },
    { value: "option2", label: "Option 2" },
    { value: "option3", label: "Option 3" },
  ];

  it("renders with label and placeholder", () => {
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        onChange={handleChange}
        placeholder="Choose an option"
      />,
    );

    expect(
      screen.getByRole("button", { name: "Test Select" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Choose an option")).toBeInTheDocument();
  });

  it("displays selected value when provided", () => {
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        value="option2"
        onChange={handleChange}
      />,
    );

    expect(screen.getByText("Option 2")).toBeInTheDocument();
  });

  it("opens dropdown when clicked", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    expect(
      screen.getByRole("listbox", { name: "Test Select" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Option 1")).toBeInTheDocument();
    expect(screen.getByText("Option 2")).toBeInTheDocument();
    expect(screen.getByText("Option 3")).toBeInTheDocument();
  });

  it("calls onChange when option is selected (single select)", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    expect(handleChange).toHaveBeenCalledWith("option1");
    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("closes dropdown after selecting option in single select mode", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    await waitFor(() => {
      expect(
        screen.queryByRole("listbox", { name: "Test Select" }),
      ).not.toBeInTheDocument();
    });
  });

  it("supports multiple selection", async () => {
    const user = userEvent.setup();
    let selectedValues: string[] = [];
    const handleChange = (value: string | string[]) => {
      selectedValues = Array.isArray(value) ? value : [];
    };

    const renderSelect = () => (
      <Select
        label="Test Select"
        options={options}
        value={selectedValues}
        onChange={handleChange}
        multiple={true}
      />
    );

    const { rerender } = render(renderSelect());

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    expect(selectedValues).toEqual(["option1"]);

    rerender(renderSelect());

    const listbox = screen.getByRole("listbox", { name: "Test Select" });
    const option2 = Array.from(listbox.querySelectorAll("li")).find((li) =>
      li.textContent?.includes("Option 2"),
    );
    expect(option2).toBeInTheDocument();
    if (option2) {
      await user.click(option2);
    }

    expect(selectedValues).toEqual(["option1", "option2"]);
  });

  it("allows deselecting options in multiple mode", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        value={["option1", "option2"]}
        onChange={handleChange}
        multiple={true}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    const option1 = screen.getByText("Option 1");
    await user.click(option1);

    expect(handleChange).toHaveBeenCalledWith(["option2"]);
  });

  it("displays selected options in multiple mode", () => {
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        value={["option1", "option3"]}
        onChange={handleChange}
        multiple={true}
      />,
    );

    expect(screen.getByText("option1, option3")).toBeInTheDocument();
  });

  it("shows checkmark for selected options", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        value="option2"
        onChange={handleChange}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    const listbox = screen.getByRole("listbox", { name: "Test Select" });
    const option2 = Array.from(listbox.querySelectorAll("li")).find((li) =>
      li.textContent?.includes("Option 2"),
    );
    expect(option2).toBeInTheDocument();
    const checkmark = option2?.querySelector("svg");
    expect(checkmark).toBeInTheDocument();
  });

  it("displays default badge for default option", () => {
    const handleChange = jest.fn();
    const optionsWithDefault = [
      { value: "option1", label: "Option 1", isDefault: true },
      { value: "option2", label: "Option 2" },
    ];

    render(
      <Select
        label="Test Select"
        options={optionsWithDefault}
        value="option1"
        onChange={handleChange}
      />,
    );

    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("handles keyboard navigation - Enter opens dropdown", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    trigger.focus();
    await user.keyboard("{Enter}");

    expect(
      screen.getByRole("listbox", { name: "Test Select" }),
    ).toBeInTheDocument();
  });

  it("handles keyboard navigation - Arrow keys navigate options", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");

    const option1 = screen.getByText("Option 1").closest("li");
    expect(option1).toHaveAttribute("tabindex", "0");

    await user.keyboard("{ArrowDown}");
    const option2 = screen.getByText("Option 2").closest("li");
    expect(option2).toHaveAttribute("tabindex", "0");
    expect(option1).toHaveAttribute("tabindex", "-1");
  });

  it("handles keyboard navigation - Enter selects focused option", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    trigger.focus();
    await user.keyboard("{Enter}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{ArrowDown}");
    await user.keyboard("{Enter}");

    expect(handleChange).toHaveBeenCalledWith("option2");
  });

  it("handles keyboard navigation - Escape closes dropdown", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select label="Test Select" options={options} onChange={handleChange} />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    expect(
      screen.getByRole("listbox", { name: "Test Select" }),
    ).toBeInTheDocument();

    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByRole("listbox", { name: "Test Select" }),
      ).not.toBeInTheDocument();
    });
  });

  it("closes dropdown when clicking outside", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <div>
        <Select label="Test Select" options={options} onChange={handleChange} />
        <button type="button">Outside</button>
      </div>,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    expect(
      screen.getByRole("listbox", { name: "Test Select" }),
    ).toBeInTheDocument();

    const outsideButton = screen.getByRole("button", { name: "Outside" });
    await user.click(outsideButton);

    await waitFor(() => {
      expect(
        screen.queryByRole("listbox", { name: "Test Select" }),
      ).not.toBeInTheDocument();
    });
  });

  it("is disabled when disabled prop is true", () => {
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        onChange={handleChange}
        disabled={true}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    expect(trigger).toBeDisabled();
  });

  it("does not open dropdown when disabled", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(
      <Select
        label="Test Select"
        options={options}
        onChange={handleChange}
        disabled={true}
      />,
    );

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    expect(
      screen.queryByRole("listbox", { name: "Test Select" }),
    ).not.toBeInTheDocument();
  });

  it("handles empty options array", () => {
    const handleChange = jest.fn();
    render(<Select label="Test Select" options={[]} onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "Test Select" });
    expect(trigger).toBeInTheDocument();
  });

  it("does not show dropdown when options are empty", async () => {
    const user = userEvent.setup();
    const handleChange = jest.fn();
    render(<Select label="Test Select" options={[]} onChange={handleChange} />);

    const trigger = screen.getByRole("button", { name: "Test Select" });
    await user.click(trigger);

    expect(
      screen.queryByRole("listbox", { name: "Test Select" }),
    ).not.toBeInTheDocument();
  });
});
