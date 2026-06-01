import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CrateSelectorPageObject } from "./CrateSelector.po";

let po: CrateSelectorPageObject;

describe("CrateSelector", () => {
  beforeEach(() => {
    po = new CrateSelectorPageObject();
  });

  it("renders component root", () => {
    po.renderCrateSelector();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders crate selector with options", () => {
    po.renderCrateSelector();

    expect(
      screen.getByRole("button", { name: /Select crate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Crate" }),
    ).toBeInTheDocument();
  });

  it("displays active crate in select", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const select = screen.getByRole("button", { name: /Select crate/i });
    await user.click(select);

    const listbox = screen.getByRole("listbox", { name: /Select crate/i });
    const crate1Option = Array.from(listbox.querySelectorAll("li")).find((li) =>
      li.textContent?.includes("Crate 1 (5)"),
    );
    expect(crate1Option).toBeInTheDocument();
  });

  it("shows crate options with release counts", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const select = screen.getByRole("button", { name: /Select crate/i });
    await user.click(select);

    const listbox = screen.getByRole("listbox", { name: /Select crate/i });
    const crate1Option = Array.from(listbox.querySelectorAll("li")).find((li) =>
      li.textContent?.includes("Crate 1 (5)"),
    );
    const crate2Option = Array.from(listbox.querySelectorAll("li")).find((li) =>
      li.textContent?.includes("Crate 2 (3)"),
    );
    const crate3Option = Array.from(listbox.querySelectorAll("li")).find((li) =>
      li.textContent?.includes("Crate 3 (0)"),
    );
    expect(crate1Option).toBeInTheDocument();
    expect(crate2Option).toBeInTheDocument();
    expect(crate3Option).toBeInTheDocument();
  });

  it("calls selectCrate when option is selected", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const select = screen.getByRole("button", { name: /Select crate/i });
    await user.click(select);

    const option2 = screen.getByText("Crate 2 (3)");
    await user.click(option2);

    expect(po.selectCrate).toHaveBeenCalledWith("2");
  });

  it("shows loading state when isLoading is true", () => {
    po.mockLoading();
    po.renderCrateSelector();

    expect(screen.getByText("Loading crates...")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Crate" }),
    ).not.toBeInTheDocument();
  });

  it("shows create form when New Crate button is clicked", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    expect(screen.getByPlaceholderText("Crate name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("creates crate when form is submitted", async () => {
    const user = userEvent.setup();
    po.createCrate.mockResolvedValue(undefined);
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(po.createCrate).toHaveBeenCalledWith("My New Crate");
    });
  });

  it("creates crate when Enter key is pressed in input", async () => {
    const user = userEvent.setup();
    po.createCrate.mockResolvedValue(undefined);
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(po.createCrate).toHaveBeenCalledWith("My New Crate");
    });
  });

  it("cancels create form when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Crate name"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Crate" }),
      ).toBeInTheDocument();
    });
  });

  it("cancels create form when Escape key is pressed", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    input.focus();
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Crate name"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Crate" }),
      ).toBeInTheDocument();
    });
  });

  it("disables Create button when input is empty", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("disables Create button when input only has whitespace", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "   ");

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("trims crate name when creating", async () => {
    const user = userEvent.setup();
    po.createCrate.mockResolvedValue(undefined);
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "  My New Crate  ");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(po.createCrate).toHaveBeenCalledWith("My New Crate");
    });
  });

  it("disables Create button when mutation is pending", async () => {
    const user = userEvent.setup();
    po.mockPendingMutation();
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("clears input and closes form after successful creation", async () => {
    const user = userEvent.setup();
    po.createCrate.mockResolvedValue(undefined);
    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(
        screen.queryByPlaceholderText("Crate name"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Crate" }),
      ).toBeInTheDocument();
    });
  });

  it("handles create error gracefully", async () => {
    const user = userEvent.setup();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();
    po.createCrate.mockRejectedValue(new Error("Failed to create crate"));

    po.renderCrateSelector();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error creating crate:",
        expect.any(Error),
      );
    });

    consoleErrorSpy.mockRestore();
  });

  it("applies custom className", () => {
    const { container } = po.renderCrateSelector({ className: "custom-class" });

    const crateSelector = container.querySelector('[class*="container"]');
    expect(crateSelector).toHaveClass("custom-class");
  });
});
