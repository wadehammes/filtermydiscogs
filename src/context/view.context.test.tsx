import { act, renderHook } from "@testing-library/react";
import { useView, ViewActionTypes, ViewProvider } from "./view.context";

describe("ViewProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default view state when no saved state exists", () => {
    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    expect(result.current.state.currentView).toBe("card");
    expect(result.current.state.previousView).toBe("card");
  });

  it("loads saved view state from localStorage", () => {
    const savedState = {
      currentView: "list",
      previousView: "card",
    };
    localStorage.setItem(
      "filtermydiscogs_view_state",
      JSON.stringify(savedState),
    );

    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    expect(result.current.state.currentView).toBe("list");
    expect(result.current.state.previousView).toBe("card");
  });

  it("sets view and updates previousView", () => {
    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.SetView,
        payload: "list",
      });
    });

    expect(result.current.state.currentView).toBe("list");
    expect(result.current.state.previousView).toBe("card");
  });

  it("does not update previousView when switching from random view", () => {
    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    // Set to list first
    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.SetView,
        payload: "list",
      });
    });

    expect(result.current.state.currentView).toBe("list");
    expect(result.current.state.previousView).toBe("card");

    // Then set to random (previousView should become "list" since we're switching FROM list)
    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.SetView,
        payload: "random",
      });
    });

    expect(result.current.state.currentView).toBe("random");
    expect(result.current.state.previousView).toBe("list"); // Should be list (the view we switched from)

    // Switch from random to another view (previousView should stay "list" since we're switching FROM random)
    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.SetView,
        payload: "card",
      });
    });

    expect(result.current.state.currentView).toBe("card");
    expect(result.current.state.previousView).toBe("list"); // Should still be list (preserved when switching from random)
  });

  it("restores previous view", () => {
    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    // Set to list
    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.SetView,
        payload: "list",
      });
    });

    expect(result.current.state.currentView).toBe("list");

    // Restore previous view
    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.RestorePreviousView,
      });
    });

    expect(result.current.state.currentView).toBe("card");
  });

  it("saves state to localStorage when state changes", () => {
    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    act(() => {
      result.current.dispatch({
        type: ViewActionTypes.SetView,
        payload: "list",
      });
    });

    const saved = localStorage.getItem("filtermydiscogs_view_state");
    expect(saved).toBeTruthy();
    if (saved) {
      const parsed = JSON.parse(saved);
      expect(parsed.currentView).toBe("list");
      expect(parsed.previousView).toBe("card");
    }
  });

  it("throws error when useView is used outside ViewProvider", () => {
    // Suppress console.error for this test
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useView());
    }).toThrow("useView must be used within a ViewProvider");

    consoleSpy.mockRestore();
  });

  it("handles invalid localStorage data gracefully", () => {
    const consoleSpy = jest.spyOn(console, "warn").mockImplementation(() => {});

    localStorage.setItem("filtermydiscogs_view_state", "invalid json");

    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    // Should fall back to default state
    expect(result.current.state.currentView).toBe("card");
    expect(result.current.state.previousView).toBe("card");

    consoleSpy.mockRestore();
  });

  it("handles localStorage data with missing fields gracefully", () => {
    localStorage.setItem(
      "filtermydiscogs_view_state",
      JSON.stringify({ currentView: "list" }),
    );

    const { result } = renderHook(() => useView(), {
      wrapper: ViewProvider,
    });

    // Should fall back to default state
    expect(result.current.state.currentView).toBe("card");
    expect(result.current.state.previousView).toBe("card");
  });
});
