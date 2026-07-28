export type ViewMode = "card" | "list" | "random";

export type ViewState = {
  currentView: ViewMode;
  previousView: ViewMode;
};

export const VIEW_MODES = new Set<ViewMode>(["card", "list", "random"]);

export const defaultViewState: ViewState = {
  currentView: "card",
  previousView: "card",
};

export const isValidViewState = (value: unknown): value is ViewState => {
  if (!value || typeof value !== "object") {
    return false;
  }

  const state = value as Partial<ViewState>;

  return (
    typeof state.currentView === "string" &&
    VIEW_MODES.has(state.currentView as ViewMode) &&
    typeof state.previousView === "string" &&
    VIEW_MODES.has(state.previousView as ViewMode)
  );
};

export const parseViewStateJson = (value: string | null): ViewState => {
  if (!value) {
    return defaultViewState;
  }

  try {
    const parsed: unknown = JSON.parse(value);
    if (isValidViewState(parsed)) {
      return parsed;
    }
  } catch (error) {
    console.warn("Failed to load view state from localStorage:", error);
  }

  return defaultViewState;
};
