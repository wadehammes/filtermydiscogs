import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { mocked } from "jest-mock";
import { useCrate } from "src/context/crate.context";
import { useCreateCrateMutation } from "src/hooks/queries/useCrateMutations";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { render } from "test-utils";
import { CrateSelector } from "./CrateSelector.component";

jest.mock("src/context/crate.context");
jest.mock("src/hooks/queries/useCrateMutations");

const mockUseCrate = mocked(useCrate);
const mockUseCreateCrateMutation = mocked(useCreateCrateMutation);

describe("CrateSelector", () => {
  const mockSelectCrate = jest.fn();
  const mockCreateCrate = jest.fn();

  const mockCrates = [
    {
      ...crateFactory.build({ id: "1", name: "Crate 1", is_default: true }),
      releaseCount: 5,
    },
    {
      ...crateFactory.build({ id: "2", name: "Crate 2", is_default: false }),
      releaseCount: 3,
    },
    {
      ...crateFactory.build({ id: "3", name: "Crate 3", is_default: false }),
      releaseCount: 0,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseCrate.mockReturnValue({
      crates: mockCrates,
      activeCrateId: "1",
      selectCrate: mockSelectCrate,
      createCrate: mockCreateCrate,
      isLoading: false,
    } as unknown as ReturnType<typeof useCrate>);

    mockUseCreateCrateMutation.mockReturnValue({
      isPending: false,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCreateCrateMutation>);
  });

  it("renders crate selector with options", () => {
    render(<CrateSelector />);

    expect(
      screen.getByRole("button", { name: /Select crate/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "New Crate" }),
    ).toBeInTheDocument();
  });

  it("displays active crate in select", async () => {
    const user = userEvent.setup();
    render(<CrateSelector />);

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
    render(<CrateSelector />);

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
    render(<CrateSelector />);

    const select = screen.getByRole("button", { name: /Select crate/i });
    await user.click(select);

    const option2 = screen.getByText("Crate 2 (3)");
    await user.click(option2);

    expect(mockSelectCrate).toHaveBeenCalledWith("2");
  });

  it("shows loading state when isLoading is true", () => {
    mockUseCrate.mockReturnValue({
      crates: [],
      activeCrateId: null,
      selectCrate: mockSelectCrate,
      createCrate: mockCreateCrate,
      isLoading: true,
    } as unknown as ReturnType<typeof useCrate>);

    render(<CrateSelector />);

    expect(screen.getByText("Loading crates...")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "New Crate" }),
    ).not.toBeInTheDocument();
  });

  it("shows create form when New Crate button is clicked", async () => {
    const user = userEvent.setup();
    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    expect(screen.getByPlaceholderText("Crate name")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  it("creates crate when form is submitted", async () => {
    const user = userEvent.setup();
    mockCreateCrate.mockResolvedValue(undefined);
    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateCrate).toHaveBeenCalledWith("My New Crate");
    });
  });

  it("creates crate when Enter key is pressed in input", async () => {
    const user = userEvent.setup();
    mockCreateCrate.mockResolvedValue(undefined);
    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");
    await user.keyboard("{Enter}");

    await waitFor(() => {
      expect(mockCreateCrate).toHaveBeenCalledWith("My New Crate");
    });
  });

  it("cancels create form when Cancel button is clicked", async () => {
    const user = userEvent.setup();
    render(<CrateSelector />);

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
    render(<CrateSelector />);

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
    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("disables Create button when input only has whitespace", async () => {
    const user = userEvent.setup();
    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "   ");

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("trims crate name when creating", async () => {
    const user = userEvent.setup();
    mockCreateCrate.mockResolvedValue(undefined);
    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "  My New Crate  ");

    const createButton = screen.getByRole("button", { name: "Create" });
    await user.click(createButton);

    await waitFor(() => {
      expect(mockCreateCrate).toHaveBeenCalledWith("My New Crate");
    });
  });

  it("disables Create button when mutation is pending", async () => {
    const user = userEvent.setup();
    mockUseCreateCrateMutation.mockReturnValue({
      isPending: true,
      mutateAsync: jest.fn(),
    } as unknown as ReturnType<typeof useCreateCrateMutation>);

    render(<CrateSelector />);

    const newCrateButton = screen.getByRole("button", { name: "New Crate" });
    await user.click(newCrateButton);

    const input = screen.getByPlaceholderText("Crate name");
    await user.type(input, "My New Crate");

    const createButton = screen.getByRole("button", { name: "Create" });
    expect(createButton).toBeDisabled();
  });

  it("clears input and closes form after successful creation", async () => {
    const user = userEvent.setup();
    mockCreateCrate.mockResolvedValue(undefined);
    render(<CrateSelector />);

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
    mockCreateCrate.mockRejectedValue(new Error("Failed to create crate"));

    render(<CrateSelector />);

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
    const { container } = render(<CrateSelector className="custom-class" />);

    const crateSelector = container.querySelector('[class*="container"]');
    expect(crateSelector).toHaveClass("custom-class");
  });
});
