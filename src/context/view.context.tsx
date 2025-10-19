import {
  createContext,
  type FC,
  type PropsWithChildren,
  useContext,
  useReducer,
} from "react";

export type ViewMode = "card" | "list" | "random";

interface ViewState {
  currentView: ViewMode;
}

export enum ViewActionTypes {
  SetView = "SET_VIEW",
}

export type ViewActions = {
  type: ViewActionTypes.SetView;
  payload: ViewMode;
};

const viewReducer = (state: ViewState, action: ViewActions): ViewState => {
  switch (action.type) {
    case ViewActionTypes.SetView:
      return {
        ...state,
        currentView: action.payload,
      };
    default:
      return state;
  }
};

const initialState: ViewState = {
  currentView: "card",
};

const ViewContext = createContext<{
  state: ViewState;
  dispatch: React.Dispatch<ViewActions>;
} | null>(null);

export const ViewProvider: FC<PropsWithChildren> = ({ children }) => {
  const [state, dispatch] = useReducer(viewReducer, initialState);

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
