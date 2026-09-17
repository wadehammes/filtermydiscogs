import { useMemo } from "react";

interface UseCrateDrawerDeletePolicyParams {
  crateCount: number;
  isDefaultCrate: boolean;
}

export const useCrateDrawerDeletePolicy = ({
  crateCount,
  isDefaultCrate,
}: UseCrateDrawerDeletePolicyParams) => {
  const deleteBlockedReason = useMemo(() => {
    if (crateCount <= 1) {
      return "You need at least one crate.";
    }

    if (isDefaultCrate) {
      return "Set another crate as default first.";
    }

    return null;
  }, [crateCount, isDefaultCrate]);

  const canDelete = deleteBlockedReason === null;

  return { deleteBlockedReason, canDelete };
};
