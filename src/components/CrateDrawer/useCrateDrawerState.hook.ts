import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCrate } from "src/context/crate.context";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { getSiteUrl } from "src/utils/helpers";

export const useCrateDrawerState = () => {
  const {
    selectedReleases,
    clearCrate,
    clearAllPacked,
    deleteCrate,
    updateCrate,
    crates,
    activeCrateId,
    isUpdatingCrate,
    isDeletingCrate,
    isLoadingCrate,
    isFetchingCrate,
    packedReleaseCount,
  } = useCrate();

  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showMakeDefaultDialog, setShowMakeDefaultDialog] = useState(false);
  const [showEditCrateDialog, setShowEditCrateDialog] = useState(false);
  const [showCrateNotesDialog, setShowCrateNotesDialog] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hidePackedItems, setHidePackedItems] = useState(false);

  const activeCrate = useMemo(
    () => crates.find((crate) => crate.id === activeCrateId),
    [crates, activeCrateId],
  );

  const crateName = activeCrate?.name || "My Crate";
  const crateNotes = activeCrate?.notes ?? "";
  const expectedReleaseCount = activeCrate?.releaseCount ?? 0;
  const hasReleaseCountMismatch =
    expectedReleaseCount > 0 && selectedReleases.length === 0;
  const isLoadingReleases =
    isLoadingCrate ||
    (hasReleaseCountMismatch && (isFetchingCrate || isLoadingCrate));
  const isDefaultCrate = activeCrate?.is_default === true;
  const isPublic = activeCrate?.private === false;
  const packedEnabled = activeCrate?.packed_enabled ?? false;
  const canDelete = crates.length > 1 && !isDefaultCrate;

  const toggleCrateBoolean = useCallback(
    async (
      field: "private" | "packed_enabled",
      afterToggle?: (nextValue: boolean) => void,
    ) => {
      if (!activeCrate) {
        return;
      }

      const nextValue = !activeCrate[field];
      await updateCrate(activeCrate.id, { [field]: nextValue });
      afterToggle?.(nextValue);
    },
    [activeCrate, updateCrate],
  );

  const handleClearConfirm = useCallback(() => {
    clearCrate();
    setShowClearDialog(false);
  }, [clearCrate]);

  const handleClearPacked = useCallback(() => {
    clearAllPacked();
    setHidePackedItems(false);
  }, [clearAllPacked]);

  const handleDeleteCrate = useCallback(async () => {
    if (!activeCrateId) {
      return;
    }

    await deleteCrate(activeCrateId);
    setShowEditCrateDialog(false);
  }, [activeCrateId, deleteCrate]);

  const handleMakeDefaultConfirm = useCallback(async () => {
    if (!activeCrateId) {
      return;
    }

    await updateCrate(activeCrateId, { is_default: true });
    setShowMakeDefaultDialog(false);
  }, [activeCrateId, updateCrate]);

  const handlePrivacyToggle = useCallback(async () => {
    await toggleCrateBoolean("private");
  }, [toggleCrateBoolean]);

  const handlePackedEnabledToggle = useCallback(async () => {
    await toggleCrateBoolean("packed_enabled", (nextPackedEnabled) => {
      if (!nextPackedEnabled) {
        setHidePackedItems(false);
      }
    });
  }, [toggleCrateBoolean]);

  const handleCopyLink = useCallback(async () => {
    if (!activeCrateId) {
      return;
    }

    const crateUrl = `${getSiteUrl()}/crate/${activeCrateId}`;
    const success = await copyToClipboard(crateUrl);

    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } else {
      toast.error("Failed to copy link to clipboard");
    }
  }, [activeCrateId]);

  const handleSaveCrateName = useCallback(
    async (name: string) => {
      if (!activeCrateId) {
        return;
      }

      await updateCrate(activeCrateId, { name });
      setShowEditCrateDialog(false);
    },
    [activeCrateId, updateCrate],
  );

  const handleSaveCrateNotes = useCallback(
    async (notes: string) => {
      if (!activeCrateId) {
        return;
      }

      const trimmedNotes = notes.trim();
      const normalizedNotes = trimmedNotes.length === 0 ? null : trimmedNotes;
      const currentNotes = activeCrate?.notes ?? null;

      if (normalizedNotes === currentNotes) {
        return;
      }

      await updateCrate(activeCrateId, { notes: normalizedNotes });
    },
    [activeCrate, activeCrateId, updateCrate],
  );

  const prevActiveCrateIdRef = useRef(activeCrateId);

  useEffect(() => {
    if (prevActiveCrateIdRef.current === activeCrateId) {
      return;
    }

    prevActiveCrateIdRef.current = activeCrateId;
    setShowEditCrateDialog(false);
    setShowCrateNotesDialog(false);
    setHidePackedItems(false);
  }, [activeCrateId]);

  return {
    activeCrateId,
    canDelete,
    copySuccess,
    crateName,
    crateNotes,
    isDefaultCrate,
    isDeletingCrate,
    isLoadingReleases,
    isPublic,
    isUpdatingCrate,
    selectedReleases,
    showClearDialog,
    showEditCrateDialog,
    showCrateNotesDialog,
    showMakeDefaultDialog,
    setShowClearDialog,
    setShowEditCrateDialog,
    setShowCrateNotesDialog,
    setShowMakeDefaultDialog,
    handleClearConfirm,
    handleClearPacked,
    handleCopyLink,
    handleDeleteCrate,
    handleMakeDefaultConfirm,
    handlePackedEnabledToggle,
    handlePrivacyToggle,
    handleSaveCrateName,
    handleSaveCrateNotes,
    hidePackedItems,
    packedCount: packedEnabled ? packedReleaseCount : 0,
    packedEnabled,
    setHidePackedItems,
  };
};
