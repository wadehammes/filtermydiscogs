import { beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { CrateSelectorPageObject } from "src/components/CrateSelector/CrateSelector.po";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { toast } from "src/utils/toast";
import { screen, waitFor } from "test-utils";

let po: CrateSelectorPageObject;

describe("CrateSelector", () => {
  beforeEach(() => {
    po = new CrateSelectorPageObject();
  });

  it("renders component root", async () => {
    po.renderCrateSelector();
    await po.waitUntilLoaded();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders crate selector with options", async () => {
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    expect(
      screen.getByRole("combobox", { name: /Select crate/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Rename" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Crate" }),
    ).toBeInTheDocument();
  });

  it("hides crate creation when allowCreate is false", async () => {
    po.renderCrateSelector({ allowCreate: false });
    await po.waitUntilLoaded();

    expect(
      screen.getByRole("combobox", { name: /Select crate/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Crate" }),
    ).not.toBeInTheDocument();
  });

  it("displays active crate in select", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    expect(screen.getByText("Crate 1 (5)")).toBeInTheDocument();

    const select = screen.getByRole("combobox", { name: /Select crate/i });
    await user.click(select);

    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { hidden: true }).length,
      ).toBeGreaterThan(0);
    });

    const crate1Option = screen
      .getAllByRole("option", { hidden: true })
      .find((option) => option.textContent?.includes("Crate 1 (5)"));
    expect(crate1Option).toBeInTheDocument();
  });

  it("shows crate options with release counts", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const select = screen.getByRole("combobox", { name: /Select crate/i });
    await user.click(select);

    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { hidden: true }).length,
      ).toBeGreaterThan(0);
    });

    const options = screen.getAllByRole("option", { hidden: true });
    const crate1Option = options.find((option) =>
      option.textContent?.includes("Crate 1 (5)"),
    );
    const crate2Option = options.find((option) =>
      option.textContent?.includes("Crate 2 (3)"),
    );
    const crate3Option = options.find((option) =>
      option.textContent?.includes("Crate 3 (0)"),
    );
    expect(crate1Option).toBeInTheDocument();
    expect(crate2Option).toBeInTheDocument();
    expect(crate3Option).toBeInTheDocument();
  });

  it("preserves crate order returned by the API", async () => {
    const user = userEvent.setup();
    po.mockCrates([
      crateWithCountFactory.build({
        id: "b",
        name: "Test Crate",
        is_default: true,
        releaseCount: 0,
      }),
      crateWithCountFactory.build({
        id: "c",
        name: "Another sick crate",
        is_default: false,
        releaseCount: 1,
      }),
      crateWithCountFactory.build({
        id: "d",
        name: "Test",
        is_default: false,
        releaseCount: 1,
      }),
      crateWithCountFactory.build({
        id: "a",
        name: "Testing Again",
        is_default: false,
        releaseCount: 1,
      }),
    ]);
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const select = screen.getByRole("combobox", { name: /Select crate/i });
    await user.click(select);

    await waitFor(() => {
      expect(screen.getAllByRole("option", { hidden: true }).length).toBe(4);
    });

    const labels = screen
      .getAllByRole("option", { hidden: true })
      .map(
        (option) => option.textContent?.replace(/Default$/, "").trim() ?? "",
      );

    expect(labels).toEqual([
      "Test Crate (0)",
      "Another sick crate (1)",
      "Test (1)",
      "Testing Again (1)",
    ]);
  });

  it("calls selectCrate when option is selected", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const select = screen.getByRole("combobox", { name: /Select crate/i });
    await user.click(select);

    await waitFor(() => {
      expect(
        screen.getAllByRole("option", { hidden: true }).length,
      ).toBeGreaterThan(0);
    });

    const option2 = screen
      .getAllByRole("option", { hidden: true })
      .find((option) => option.textContent?.includes("Crate 2 (3)"));
    expect(option2).toBeDefined();
    const clickUser = userEvent.setup({ pointerEventsCheck: 0 });
    await clickUser.click(option2 as Element);

    await waitFor(() => {
      expect(po.mockApiHelpers.crate).toHaveBeenCalledWith("2");
    });
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
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    expect(screen.getByLabelText("Crate name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("creates crate when form is submitted", async () => {
    const user = userEvent.setup();
    po.mockCreateCrateResponse("My New Crate");
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(po.mockApiHelpers.createCrate).toHaveBeenCalledWith(
        "My New Crate",
      );
    });
  });

  it("creates crate when Enter key is pressed in input", async () => {
    const user = userEvent.setup();
    po.mockCreateCrateResponse("My New Crate");
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "My New Crate");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(po.mockApiHelpers.createCrate).toHaveBeenCalledWith(
        "My New Crate",
      );
    });
  });

  it("cancels create form when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const cancelButton = screen.getByRole("button", { name: "Cancel" });
    await user.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByLabelText("Crate name")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Crate" }),
      ).toBeInTheDocument();
    });
  });

  it("cancels create form when Escape key is pressed", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    input.focus();
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(screen.queryByLabelText("Crate name")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Crate" }),
      ).toBeInTheDocument();
    });
  });

  it("disables Create button when input is empty", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("disables Create button when input only has whitespace", async () => {
    const user = userEvent.setup();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "   ");

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("trims crate name when creating", async () => {
    const user = userEvent.setup();
    po.mockCreateCrateResponse("My New Crate");
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "  My New Crate  ");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(po.mockApiHelpers.createCrate).toHaveBeenCalledWith(
        "My New Crate",
      );
    });
  });

  it("keeps create form open while create request is in flight", async () => {
    const user = userEvent.setup();
    po.mockSlowCreateCrate();
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(po.mockApiHelpers.createCrate).toHaveBeenCalledWith(
        "My New Crate",
      );
    });
    expect(screen.getByLabelText("Crate name")).toBeInTheDocument();
    expect(createButton).toBeInTheDocument();
  });

  it("clears input and closes form after successful creation", async () => {
    const user = userEvent.setup();
    po.mockCreateCrateResponse("My New Crate");
    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(screen.queryByLabelText("Crate name")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "New Crate" }),
      ).toBeInTheDocument();
    });
  });

  it("handles create error gracefully", async () => {
    const user = userEvent.setup();
    const toastErrorSpy = jest
      .spyOn(toast, "error")
      .mockImplementation(() => "toast-id");
    po.mockCreateCrateError();

    po.renderCrateSelector();
    await po.waitUntilLoaded();

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByLabelText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(toastErrorSpy).toHaveBeenCalledWith("Failed to create crate", {
        description: "Failed to create crate",
      });
    });

    expect(screen.getByLabelText("Crate name")).toBeInTheDocument();
    expect(screen.getByDisplayValue("My New Crate")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Crate" }),
    ).not.toBeInTheDocument();

    toastErrorSpy.mockRestore();
  });

  it("applies custom className", async () => {
    const { container } = po.renderCrateSelector({ className: "custom-class" });
    await po.waitUntilLoaded();

    const crateSelector = container.querySelector('[class*="container"]');
    expect(crateSelector).toHaveClass("custom-class");
  });
});
