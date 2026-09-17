import {
  type Dispatch,
  type SetStateAction,
  useCallback,
  useEffect,
  useReducer,
  useRef,
} from "react";

type CrateDrawerDialogUiState = {
  showClearDialog: boolean;
  showClearPackedDialog: boolean;
  showDeleteDialog: boolean;
  showMakeDefaultDialog: boolean;
  showEditCrateDialog: boolean;
  hidePackedItems: boolean;
  drawerNotesOpen: boolean;
};

type CrateDrawerDialogUiField = keyof CrateDrawerDialogUiState;

export enum CrateDrawerDialogUiActionTypes {
  ActiveCrateChanged = "ActiveCrateChanged",
  SetField = "SetField",
}

type CrateDrawerDialogUiAction =
  | { type: CrateDrawerDialogUiActionTypes.ActiveCrateChanged }
  | {
      type: CrateDrawerDialogUiActionTypes.SetField;
      field: CrateDrawerDialogUiField;
      next: SetStateAction<boolean>;
    };

const initialCrateDrawerDialogUiState: CrateDrawerDialogUiState = {
  showClearDialog: false,
  showClearPackedDialog: false,
  showDeleteDialog: false,
  showMakeDefaultDialog: false,
  showEditCrateDialog: false,
  hidePackedItems: false,
  drawerNotesOpen: false,
};

export const crateDrawerDialogUiReducer = (
  state: CrateDrawerDialogUiState,
  action: CrateDrawerDialogUiAction,
): CrateDrawerDialogUiState => {
  switch (action.type) {
    case CrateDrawerDialogUiActionTypes.ActiveCrateChanged:
      return {
        ...state,
        showEditCrateDialog: false,
        showClearPackedDialog: false,
        showDeleteDialog: false,
        hidePackedItems: false,
        drawerNotesOpen: false,
      };
    case CrateDrawerDialogUiActionTypes.SetField: {
      const current = state[action.field];
      const nextValue =
        typeof action.next === "function"
          ? action.next(current)
          : action.next;
      return { ...state, [action.field]: nextValue };
    }
    default:
      return state;
  }
};

const useDialogUiFieldSetter = (
  dispatch: Dispatch<CrateDrawerDialogUiAction>,
  field: CrateDrawerDialogUiField,
) =>
  useCallback(
    (next: SetStateAction<boolean>) => {
      dispatch({
        type: CrateDrawerDialogUiActionTypes.SetField,
        field,
        next,
      });
    },
    [dispatch, field],
  );

export const useCrateDrawerDialogUi = (activeCrateId: string | null) => {
  const [state, dispatch] = useReducer(
    crateDrawerDialogUiReducer,
    initialCrateDrawerDialogUiState,
  );

  const prevActiveCrateIdRef = useRef(activeCrateId);

  useEffect(() => {
    if (prevActiveCrateIdRef.current === activeCrateId) {
      return;
    }

    prevActiveCrateIdRef.current = activeCrateId;
    dispatch({ type: CrateDrawerDialogUiActionTypes.ActiveCrateChanged });
  }, [activeCrateId]);

  const setShowClearDialog = useDialogUiFieldSetter(
    dispatch,
    "showClearDialog",
  );
  const setShowClearPackedDialog = useDialogUiFieldSetter(
    dispatch,
    "showClearPackedDialog",
  );
  const setShowDeleteDialog = useDialogUiFieldSetter(dispatch, "showDeleteDialog");
  const setShowMakeDefaultDialog = useDialogUiFieldSetter(
    dispatch,
    "showMakeDefaultDialog",
  );
  const setShowEditCrateDialog = useDialogUiFieldSetter(
    dispatch,
    "showEditCrateDialog",
  );
  const setHidePackedItems = useDialogUiFieldSetter(dispatch, "hidePackedItems");
  const setDrawerNotesOpen = useDialogUiFieldSetter(
    dispatch,
    "drawerNotesOpen",
  );

  return {
    showClearDialog: state.showClearDialog,
    setShowClearDialog,
    showClearPackedDialog: state.showClearPackedDialog,
    setShowClearPackedDialog,
    showDeleteDialog: state.showDeleteDialog,
    setShowDeleteDialog,
    showMakeDefaultDialog: state.showMakeDefaultDialog,
    setShowMakeDefaultDialog,
    showEditCrateDialog: state.showEditCrateDialog,
    setShowEditCrateDialog,
    hidePackedItems: state.hidePackedItems,
    setHidePackedItems,
    drawerNotesOpen: state.drawerNotesOpen,
    setDrawerNotesOpen,
  };
};
