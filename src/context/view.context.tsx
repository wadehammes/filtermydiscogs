import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useEffect,
  useReducer,
} from "react";

export type ViewMode = "card" | "list" | "random";

interface ViewState {
  currentView: ViewMode;
  previousView: ViewMode;
}

const VIEW_STORAGE_KEY = "filtermydiscogs_view_state";

// Helper functions for localStorage
const saveViewState = ({
  state,
  storageKey,
}: {
  state: ViewState;
  storageKey: string;
}) => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to save view state to localStorage:", error);
  }
};

const loadViewState = ({
  storageKey,
}: {
  storageKey: string;
}): ViewState | null => {
  if (typeof window === "undefined") return null;
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that the parsed state has the expected structure
      if (
        parsed &&
        typeof parsed.currentView === "string" &&
        typeof parsed.previousView === "string"
      ) {
        return parsed as ViewState;
      }
    }
  } catch (error) {
    console.warn("Failed to load view state from localStorage:", error);
  }
  return null;
};

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

const viewReducer = (state: ViewState, action: ViewActions): ViewState => {
  switch (action.type) {
    case ViewActionTypes.SetView:
      return {
        ...state,
        previousView:
          state.currentView === "random"
            ? state.previousView
            : state.currentView,
        currentView: action.payload,
      };
    case ViewActionTypes.RestorePreviousView:
      return {
        ...state,
        currentView: state.previousView,
      };
    default:
      return state;
  }
};

const getInitialState = ({ storageKey }: { storageKey: string }): ViewState => {
  const saved = loadViewState({ storageKey });
  return (
    saved || {
      currentView: "card",
      previousView: "card",
    }
  );
};

const ViewContext = createContext<{
  state: ViewState;
  dispatch: React.Dispatch<ViewActions>;
} | null>(null);

export const ViewProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(
    viewReducer,
    getInitialState({ storageKey: VIEW_STORAGE_KEY }),
  );

  // Save state to localStorage whenever it changes
  useEffect(() => {
    saveViewState({ state, storageKey: VIEW_STORAGE_KEY });
  }, [state]);

  return (
    <ViewContext.Provider value={{ state, dispatch }}>
      {children}
    </ViewContext.Provider>
  );
};

export const useView = () => {
  const context = useContext(ViewContext);
  if (!context) {
    throw new Error("useView must be used within a ViewProvider");
  }
  return context;
};
