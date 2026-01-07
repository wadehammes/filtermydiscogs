import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { render } from "test-utils";
import { SearchBar } from "./SearchBar.component";

const mockUseFilters = jest.fn();
const mockDispatch = jest.fn();

jest.mock("src/context/filters.context", () => {
  return {
    FiltersActionTypes: {
      SetSearchQuery: "SET_SEARCH_QUERY",
      SetSearching: "SET_SEARCHING",
    },
    useFilters: () => mockUseFilters(),
  };
});

describe("SearchBar", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseFilters.mockReturnValue({
      state: {
        searchQuery: "",
        isSearching: false,
      },
      dispatch: mockDispatch,
    });
  });

  it("renders with placeholder", () => {
    render(<SearchBar placeholder="Search..." />);

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders with default placeholder", () => {
    render(<SearchBar />);

    expect(
      screen.getByPlaceholderText("Search your collection..."),
    ).toBeInTheDocument();
  });

  it("updates input value when typing", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");

    expect(input).toHaveValue("test query");
  });

  it("debounces search query dispatch", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    expect(mockDispatch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith({
        type: "SET_SEARCH_QUERY",
        payload: "test",
      });
    });

    jest.useRealTimers();
  });

  it("shows clear button when input has value", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    expect(
      screen.getByRole("button", { name: "Clear search" }),
    ).toBeInTheDocument();
  });

  it("hides clear button when input is empty", () => {
    render(<SearchBar />);

    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("clears input and search query when clear button is clicked", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    await user.click(clearButton);

    expect(input).toHaveValue("");
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCHING",
      payload: false,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCH_QUERY",
      payload: "",
    });
  });

  it("clears input when Escape key is pressed", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue("");
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCHING",
      payload: false,
    });
    expect(mockDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCH_QUERY",
      payload: "",
    });
  });

  it("focuses input after clearing", async () => {
    const user = userEvent.setup();
    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("syncs input value when searchQuery is cleared externally", async () => {
    const user = userEvent.setup();

    mockUseFilters.mockReturnValue({
      state: {
        searchQuery: "",
        isSearching: false,
      },
      dispatch: mockDispatch,
    });

    const { rerender } = render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");

    await waitFor(
      () => {
        expect(mockDispatch).toHaveBeenCalledWith({
          type: "SET_SEARCH_QUERY",
          payload: "test query",
        });
      },
      { timeout: 1000 },
    );

    mockUseFilters.mockReturnValue({
      state: {
        searchQuery: "test query",
        isSearching: false,
      },
      dispatch: mockDispatch,
    });

    rerender(<SearchBar />);

    await waitFor(() => {
      expect(input).toHaveValue("test query");
    });

    mockUseFilters.mockReturnValue({
      state: {
        searchQuery: "",
        isSearching: false,
      },
      dispatch: mockDispatch,
    });

    rerender(<SearchBar />);

    await waitFor(
      () => {
        expect(input).toHaveValue("");
      },
      { timeout: 1000 },
    );
  });

  it("applies searching class when isSearching is true", () => {
    mockUseFilters.mockReturnValue({
      state: {
        searchQuery: "test",
        isSearching: true,
      },
      dispatch: mockDispatch,
    });

    render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    expect(input.className).toContain("searching");
  });

  it("is disabled when disabled prop is true", () => {
    render(<SearchBar disabled={true} />);

    const input = screen.getByPlaceholderText("Search your collection...");
    expect(input).toBeDisabled();
  });

  it("does not dispatch when disabled", async () => {
    const user = userEvent.setup();
    render(<SearchBar disabled={true} />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    expect(mockDispatch).not.toHaveBeenCalled();
  });

  it("cleans up debounce timeout on unmount", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    const { unmount } = render(<SearchBar />);

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    unmount();

    expect(() => {
      jest.advanceTimersByTime(300);
    }).not.toThrow();

    jest.useRealTimers();
  });
});
