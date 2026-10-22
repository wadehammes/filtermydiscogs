"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { useReleaseCrateMenuDerivedState } from "src/components/ReleaseCard/useReleaseCrateMenuDerivedState.hook";
import { useAuth } from "src/context/auth.context";
import { useCrateActions, useCrateState } from "src/context/crate.context";
import { prefetchReleaseCrateMembership } from "src/hooks/queries/useReleaseCrateMembershipQuery";
import { useScrollEdgeFade } from "src/hooks/useScrollEdgeFade.hook";
import type { CreateCrateFormValues } from "src/lib/validation/crate.schemas";
import type { DiscogsRelease } from "src/types";

export const useReleaseCrateMenuController = (
  release: DiscogsRelease,
  isMenuOpen: boolean,
  onRequestCloseMenu?: () => void,
) => {
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const {
    state: { userId },
  } = useAuth();
  const {
    crates,
    activeCrateId,
    activeCrateInstanceIds,
    isLoading,
    isUpdatingCrate,
    isCreatingCrate,
  } = useCrateState();
  const {
    addReleaseToCrate,
    removeReleaseFromCrate,
    setReleaseCrateMembership,
    createCrate,
  } = useCrateActions();
  const isCrateActionPending = isCreatingCrate || isUpdatingCrate;

  const {
    instanceId,
    memberCrateIds,
    inActiveCrate,
    activeCrate,
    otherCrates,
    isInAllCrates,
    showToggleAllAction,
  } = useReleaseCrateMenuDerivedState({
    release,
    userId,
    isOpen: isMenuOpen,
    crates,
    activeCrateId,
    activeCrateInstanceIds,
  });

  const {
    scrollRef: crateListScrollRef,
    fade: crateListScrollFade,
    onScroll: updateCrateListScrollFade,
  } = useScrollEdgeFade<HTMLDivElement>({
    enabled: isMenuOpen && otherCrates.length > 0,
  });

  const prefetchMembership = useCallback(() => {
    void prefetchReleaseCrateMembership(queryClient, { userId, instanceId });
  }, [instanceId, queryClient, userId]);

  const handleCheckedChange = useCallback(
    (crateId: string, checked: boolean) => {
      if (checked) {
        addReleaseToCrate(crateId, release, {
          openDrawer: crateId === activeCrateId,
        });
        return;
      }

      removeReleaseFromCrate(crateId, instanceId);
    },
    [
      activeCrateId,
      addReleaseToCrate,
      instanceId,
      release,
      removeReleaseFromCrate,
    ],
  );

  const handleToggleAllCrates = useCallback(() => {
    const targetCrateIds = isInAllCrates ? [] : crates.map((crate) => crate.id);

    setReleaseCrateMembership(targetCrateIds, release, {
      openDrawer:
        !isInAllCrates &&
        activeCrateId !== null &&
        targetCrateIds.includes(activeCrateId),
    });
  }, [
    activeCrateId,
    crates,
    isInAllCrates,
    release,
    setReleaseCrateMembership,
  ]);

  const handleOpenCreateDialog = useCallback(() => {
    onRequestCloseMenu?.();
    setShowCreateDialog(true);
  }, [onRequestCloseMenu]);

  const closeCreateDialog = useCallback(() => {
    setShowCreateDialog(false);
  }, []);

  const handleCreateCrate = useCallback(
    async ({ name, setAsDefault }: CreateCrateFormValues) => {
      const crateId = await createCrate(name, { setAsDefault });

      if (!crateId) {
        return;
      }

      addReleaseToCrate(crateId, release, { openDrawer: true });
      setShowCreateDialog(false);
    },
    [addReleaseToCrate, createCrate, release],
  );

  return {
    isLoading,
    isCrateActionPending,
    showCreateDialog,
    closeCreateDialog,
    prefetchMembership,
    handleCreateCrate,
    panelContentProps: {
      inActiveCrate,
      activeCrate,
      otherCrates,
      cratesCount: crates.length,
      memberCrateIds,
      showToggleAllAction,
      isInAllCrates,
      isCrateActionPending,
      crateListScrollRef,
      crateListScrollFade,
      updateCrateListScrollFade,
      onCheckedChange: handleCheckedChange,
      onToggleAllCrates: handleToggleAllCrates,
      onOpenCreateDialog: handleOpenCreateDialog,
    },
  };
};
