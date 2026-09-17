import { useEffect, useRef, useState } from "react";

export const useCrateDrawerDialogUi = (activeCrateId: string | null) => {
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showClearPackedDialog, setShowClearPackedDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showMakeDefaultDialog, setShowMakeDefaultDialog] = useState(false);
  const [showEditCrateDialog, setShowEditCrateDialog] = useState(false);
  const [hidePackedItems, setHidePackedItems] = useState(false);
  const [drawerNotesOpen, setDrawerNotesOpen] = useState(false);

  const prevActiveCrateIdRef = useRef(activeCrateId);

  useEffect(() => {
    if (prevActiveCrateIdRef.current === activeCrateId) {
      return;
    }

    prevActiveCrateIdRef.current = activeCrateId;
    setShowEditCrateDialog(false);
    setShowClearPackedDialog(false);
    setShowDeleteDialog(false);
    setHidePackedItems(false);
    setDrawerNotesOpen(false);
  }, [activeCrateId]);

  return {
    showClearDialog,
    setShowClearDialog,
    showClearPackedDialog,
    setShowClearPackedDialog,
    showDeleteDialog,
    setShowDeleteDialog,
    showMakeDefaultDialog,
    setShowMakeDefaultDialog,
    showEditCrateDialog,
    setShowEditCrateDialog,
    hidePackedItems,
    setHidePackedItems,
    drawerNotesOpen,
    setDrawerNotesOpen,
  };
};
