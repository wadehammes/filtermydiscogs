import {
  CrateDrawerDialogUiActionTypes,
  crateDrawerDialogUiReducer,
} from "src/components/CrateDrawer/useCrateDrawerDialogUi.hook";

describe("crateDrawerDialogUiReducer", () => {
  const baseState = {
    showClearDialog: true,
    showClearPackedDialog: true,
    showDeleteDialog: true,
    showMakeDefaultDialog: true,
    showEditCrateDialog: true,
    hidePackedItems: true,
    drawerNotesOpen: true,
  };

  it("clears crate-scoped UI when the active crate changes", () => {
    expect(
      crateDrawerDialogUiReducer(baseState, {
        type: CrateDrawerDialogUiActionTypes.ActiveCrateChanged,
      }),
    ).toEqual({
      showClearDialog: true,
      showClearPackedDialog: false,
      showDeleteDialog: false,
      showMakeDefaultDialog: true,
      showEditCrateDialog: false,
      hidePackedItems: false,
      drawerNotesOpen: false,
    });
  });

  it("supports functional updates for a single field", () => {
    expect(
      crateDrawerDialogUiReducer(
        { ...baseState, drawerNotesOpen: false },
        {
          type: CrateDrawerDialogUiActionTypes.SetField,
          field: "drawerNotesOpen",
          next: (open) => !open,
        },
      ),
    ).toEqual({
      ...baseState,
      drawerNotesOpen: true,
    });
  });
});
