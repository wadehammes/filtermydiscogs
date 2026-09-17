import { usePathname, useRouter } from "next/navigation";
import { useCallback, useMemo } from "react";
import { useCrateDrawerDeletePolicy } from "src/components/CrateDrawer/useCrateDrawerDeletePolicy.hook";
import { useCrateDrawerDialogUi } from "src/components/CrateDrawer/useCrateDrawerDialogUi.hook";
import { useCrate } from "src/context/crate.context";
import { copyToClipboard } from "src/utils/copyToClipboard";
import { getSiteUrl } from "src/utils/helpers";
import { toast } from "src/utils/toast";

export const useCrateDrawerState = () => {
  const {
    selectedReleases,
    layoutItems,
    clearCrate,
    clearAllPacked,
    deleteCrate,
    updateCrate,
    crates,
    activeCrateId,
    isUpdatingCrate,
    isDeletingCrate,
    isPendingCrate,
    packedReleaseCount,
  } = useCrate();

  const router = useRouter();
  const pathname = usePathname();

  const dialogUi = useCrateDrawerDialogUi(activeCrateId);
  const {
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
  } = dialogUi;

  const activeCrate = useMemo(
    () => crates.find((crate) => crate.id === activeCrateId),
    [crates, activeCrateId],
  );

  const crateName = activeCrate?.name || "My Crate";
  const crateNotes = activeCrate?.notes ?? "";
  const isLoadingReleases = isPendingCrate && selectedReleases.length === 0;
  const isDefaultCrate = activeCrate?.is_default === true;
  const isPublic = activeCrate?.private === false;
  const packedEnabled = activeCrate?.packed_enabled ?? false;

  const { deleteBlockedReason, canDelete } = useCrateDrawerDeletePolicy({
    crateCount: crates.length,
    isDefaultCrate,
  });

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
  }, [clearCrate, setShowClearDialog]);

  const handleClearPackedConfirm = useCallback(() => {
    clearAllPacked();
    setHidePackedItems(false);
    setShowClearPackedDialog(false);
  }, [clearAllPacked, setHidePackedItems, setShowClearPackedDialog]);

  const handleDeleteCrate = useCallback(async () => {
    if (!(activeCrateId && canDelete)) {
      return;
    }

    const deletedCrateId = activeCrateId;
    await deleteCrate(deletedCrateId);
    setShowEditCrateDialog(false);
    setShowDeleteDialog(false);

    if (pathname === `/crates/${deletedCrateId}`) {
      router.push("/crates");
    }
  }, [
    activeCrateId,
    canDelete,
    deleteCrate,
    pathname,
    router,
    setShowDeleteDialog,
    setShowEditCrateDialog,
  ]);

  const handleMakeDefaultConfirm = useCallback(async () => {
    if (!activeCrateId) {
      return;
    }

    await updateCrate(activeCrateId, { is_default: true });
    setShowMakeDefaultDialog(false);
  }, [activeCrateId, setShowMakeDefaultDialog, updateCrate]);

  const handlePrivacyToggle = useCallback(async () => {
    await toggleCrateBoolean("private");
  }, [toggleCrateBoolean]);

  const handleSetCratePublic = useCallback(
    async (nextIsPublic: boolean) => {
      if (!activeCrate || nextIsPublic === (activeCrate.private === false)) {
        return;
      }

      await updateCrate(activeCrate.id, { private: !nextIsPublic });
    },
    [activeCrate, updateCrate],
  );

  const handlePackedEnabledToggle = useCallback(async () => {
    await toggleCrateBoolean("packed_enabled", (nextPackedEnabled) => {
      if (!nextPackedEnabled) {
        setHidePackedItems(false);
      }
    });
  }, [setHidePackedItems, toggleCrateBoolean]);

  const handleCopyLink = useCallback(async () => {
    if (!activeCrateId) {
      return;
    }

    const crateUrl = `${getSiteUrl()}/crate/${activeCrateId}`;
    const success = await copyToClipboard(crateUrl);

    if (success) {
      toast.success("Link copied to clipboard");
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
    [activeCrateId, setShowEditCrateDialog, updateCrate],
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

  return {
    activeCrateId,
    canDelete,
    crateName,
    crateNotes,
    deleteBlockedReason,
    drawerNotesOpen,
    isDefaultCrate,
    isDeletingCrate,
    isLoadingReleases,
    isPublic,
    isUpdatingCrate,
    selectedReleases,
    layoutItems,
    showClearDialog,
    showClearPackedDialog,
    showDeleteDialog,
    showEditCrateDialog,
    showMakeDefaultDialog,
    setShowClearDialog,
    setShowClearPackedDialog,
    setShowDeleteDialog,
    setShowEditCrateDialog,
    setShowMakeDefaultDialog,
    setDrawerNotesOpen,
    handleClearConfirm,
    handleClearPackedConfirm,
    handleCopyLink,
    handleDeleteCrate,
    handleMakeDefaultConfirm,
    handlePackedEnabledToggle,
    handlePrivacyToggle,
    handleSaveCrateName,
    handleSaveCrateNotes,
    handleSetCratePublic,
    hidePackedItems,
    packedCount: packedEnabled ? packedReleaseCount : 0,
    packedEnabled,
    setHidePackedItems,
  };
};
