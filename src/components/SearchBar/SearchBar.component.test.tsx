import userEvent from "@testing-library/user-event";
import { screen, waitFor } from "src/tests/utils/test-utils";
import { mockFiltersDispatch, SearchBarPageObject } from "./SearchBar.po";

let po: SearchBarPageObject;

describe("SearchBar", () => {
  beforeEach(() => {
    po = new SearchBarPageObject();
  });

  it("renders component root", () => {
    po.renderSearchBar();
    expect(screen.getByTestId(po.testId)).toBeInTheDocument();
  });

  it("renders with placeholder", () => {
    po.renderSearchBar({ placeholder: "Search..." });

    expect(screen.getByPlaceholderText("Search...")).toBeInTheDocument();
  });

  it("renders with default placeholder", () => {
    po.renderSearchBar();

    expect(
      screen.getByPlaceholderText("Search your collection..."),
    ).toBeInTheDocument();
  });

  it("updates input value when typing", async () => {
    const user = userEvent.setup();
    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");

    expect(input).toHaveValue("test query");
  });

  it("debounces search query dispatch", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    expect(mockFiltersDispatch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(300);

    await waitFor(() => {
      expect(mockFiltersDispatch).toHaveBeenCalledWith({
        type: "SET_SEARCH_QUERY",
        payload: "test",
      });
    });

    jest.useRealTimers();
  });

  it("shows clear button when input has value", async () => {
    const user = userEvent.setup();
    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    expect(
      screen.getByRole("button", { name: "Clear search" }),
    ).toBeInTheDocument();
  });

  it("hides clear button when input is empty", () => {
    po.renderSearchBar();

    expect(
      screen.queryByRole("button", { name: "Clear search" }),
    ).not.toBeInTheDocument();
  });

  it("clears input and search query when clear button is clicked", async () => {
    const user = userEvent.setup();
    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");

    const clearButton = screen.getByRole("button", { name: "Clear search" });
    await user.click(clearButton);

    expect(input).toHaveValue("");
    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCHING",
      payload: false,
    });
    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCH_QUERY",
      payload: "",
    });
  });

  it("clears input when Escape key is pressed", async () => {
    const user = userEvent.setup();
    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");
    await user.keyboard("{Escape}");

    expect(input).toHaveValue("");
    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCHING",
      payload: false,
    });
    expect(mockFiltersDispatch).toHaveBeenCalledWith({
      type: "SET_SEARCH_QUERY",
      payload: "",
    });
  });

  it("focuses input after clearing", async () => {
    const user = userEvent.setup();
    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");
    await user.keyboard("{Escape}");

    await waitFor(() => {
      expect(input).toHaveFocus();
    });
  });

  it("syncs input value when searchQuery is cleared externally", async () => {
    const user = userEvent.setup();

    po.resetFiltersMock();

    const { rerender } = po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test query");

    await waitFor(
      () => {
        expect(mockFiltersDispatch).toHaveBeenCalledWith({
          type: "SET_SEARCH_QUERY",
          payload: "test query",
        });
      },
      { timeout: 1000 },
    );

    po.resetFiltersMock({ searchQuery: "test query" });

    po.rerenderSearchBar(rerender);

    await waitFor(() => {
      expect(input).toHaveValue("test query");
    });

    po.resetFiltersMock({ searchQuery: "" });

    po.rerenderSearchBar(rerender);

    await waitFor(
      () => {
        expect(input).toHaveValue("");
      },
      { timeout: 1000 },
    );
  });

  it("applies searching class when isSearching is true", () => {
    po.resetFiltersMock({ searchQuery: "test", isSearching: true });

    po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    expect(input.className).toContain("searching");
  });

  it("is disabled when disabled prop is true", () => {
    po.renderSearchBar({ disabled: true });

    const input = screen.getByPlaceholderText("Search your collection...");
    expect(input).toBeDisabled();
  });

  it("does not dispatch when disabled", async () => {
    const user = userEvent.setup();
    po.renderSearchBar({ disabled: true });

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    expect(mockFiltersDispatch).not.toHaveBeenCalled();
  });

  it("cleans up debounce timeout on unmount", async () => {
    jest.useFakeTimers();
    const user = userEvent.setup({ delay: null });
    const { unmount } = po.renderSearchBar();

    const input = screen.getByPlaceholderText("Search your collection...");
    await user.type(input, "test");

    unmount();

    expect(() => {
      jest.advanceTimersByTime(300);
    }).not.toThrow();

    jest.useRealTimers();
  });
});
