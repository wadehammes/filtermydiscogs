interface ResolveCrateDrawerDeletePolicyParams {
  crateCount: number;
  isDefaultCrate: boolean;
}

export const resolveCrateDrawerDeletePolicy = ({
  crateCount,
  isDefaultCrate,
}: ResolveCrateDrawerDeletePolicyParams) => {
  if (crateCount <= 1) {
    return {
      canDelete: false,
      deleteBlockedReason: "You need at least one crate.",
    } as const;
  }

  if (isDefaultCrate) {
    return {
      canDelete: false,
      deleteBlockedReason: "Set another crate as default first.",
    } as const;
  }

  return {
    canDelete: true,
    deleteBlockedReason: null,
  } as const;
};
