import { atom } from "jotai";
import { atomWithStorage, createJSONStorage } from "jotai/utils";
import { VIEW_STATE_STORAGE_KEY } from "src/constants/storageKeys";
import {
  defaultViewState,
  parseViewStateJson,
  type ViewMode,
  type ViewState,
} from "src/types/view.types";

export type { ViewMode, ViewState } from "src/types/view.types";
export { defaultViewState, parseViewStateJson as parseViewState };

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
  VIEW_STATE_STORAGE_KEY,
  defaultViewState,
  {
    ...viewStorage,
    getItem: (key, initialValue) => {
      if (typeof window === "undefined") return initialValue;
      const stored = localStorage.getItem(key);
      return parseViewStateJson(stored);
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
