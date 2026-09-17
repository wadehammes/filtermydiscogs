"use client";

import { useMemo } from "react";
import { useReleaseCrateMembershipQuery } from "src/hooks/queries/useReleaseCrateMembershipQuery";
import type { DiscogsRelease } from "src/types";

interface UseReleaseCrateMenuDerivedStateParams {
  release: DiscogsRelease;
  userId: string | null;
  isOpen: boolean;
  crates: { id: string; name: string }[];
  activeCrateId: string | null;
  activeCrateInstanceIds: ReadonlySet<string>;
}

export const useReleaseCrateMenuDerivedState = ({
  release,
  userId,
  isOpen,
  crates,
  activeCrateId,
  activeCrateInstanceIds,
}: UseReleaseCrateMenuDerivedStateParams) => {
  const instanceId = String(release.instance_id);
  const { data: membership } = useReleaseCrateMembershipQuery({
    userId,
    instanceId,
    enabled: isOpen,
  });

  const memberCrateIds = useMemo(() => {
    const ids = new Set(membership?.crateIds ?? []);

    if (activeCrateInstanceIds.has(instanceId) && activeCrateId) {
      ids.add(activeCrateId);
    }

    return ids;
  }, [activeCrateId, activeCrateInstanceIds, instanceId, membership?.crateIds]);

  const inActiveCrate = activeCrateInstanceIds.has(instanceId);
  const activeCrate = useMemo(
    () => crates.find((crate) => crate.id === activeCrateId) ?? null,
    [activeCrateId, crates],
  );
  const otherCrates = useMemo(
    () => crates.filter((crate) => crate.id !== activeCrateId),
    [activeCrateId, crates],
  );
  const isInAllCrates = useMemo(
    () =>
      crates.length > 0 &&
      crates.every((crate) => memberCrateIds.has(crate.id)),
    [crates, memberCrateIds],
  );
  const showToggleAllAction = crates.length > 1;

  return {
    instanceId,
    memberCrateIds,
    inActiveCrate,
    activeCrate,
    otherCrates,
    isInAllCrates,
    showToggleAllAction,
  };
};
