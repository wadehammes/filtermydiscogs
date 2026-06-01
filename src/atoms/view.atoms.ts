import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";

export type ViewMode = "card" | "list" | "random";

export interface ViewState {
  currentView: ViewMode;
  previousView: ViewMode;
}

const VIEW_STORAGE_KEY = "filtermydiscogs_view_state";

const defaultViewState: ViewState = {
  currentView: "card",
  previousView: "card",
};

const isValidViewState = (value: unknown): value is ViewState => {
  if (!value || typeof value !== "object") return false;
  const state = value as Partial<ViewState>;
  return (
    typeof state.currentView === "string" &&
    typeof state.previousView === "string"
  );
};

const parseViewState = (value: string | null): ViewState => {
  if (!value) return defaultViewState;

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

const viewStorage = createJSONStorage<ViewState>(() => ({
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    localStorage.setItem(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
  },
}));

export const viewStateAtom = atomWithStorage<ViewState>(
  VIEW_STORAGE_KEY,
  defaultViewState,
  {
    ...viewStorage,
    getItem: (key, initialValue) => {
      if (typeof window === "undefined") return initialValue;
      const stored = localStorage.getItem(key);
      return parseViewState(stored);
    },
  },
);

export const currentViewAtom = atom((get) => get(viewStateAtom).currentView);

export const previousViewAtom = atom((get) => get(viewStateAtom).previousView);

export enum ViewActionTypes {
  SetView = "SET_VIEW",
  RestorePreviousView = "RESTORE_PREVIOUS_VIEW",
}

export type ViewActions =
  | {
      type: ViewActionTypes.SetView;
      payload: ViewMode;
    }
  | {
      type: ViewActionTypes.RestorePreviousView;
    };

export const viewDispatchAtom = atom(null, (get, set, action: ViewActions) => {
  const state = get(viewStateAtom);

  switch (action.type) {
    case ViewActionTypes.SetView: {
      set(viewStateAtom, {
        previousView:
          state.currentView === "random"
            ? state.previousView
            : state.currentView,
        currentView: action.payload,
      });
      return;
    }

    case ViewActionTypes.RestorePreviousView:
      set(viewStateAtom, {
        ...state,
        currentView: state.previousView,
      });
      return;

    default:
      return;
  }
});
