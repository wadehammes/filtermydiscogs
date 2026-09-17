import { useMemo } from "react";
import { resolveCrateDrawerDeletePolicy } from "src/utils/crateDrawerDeletePolicy";

interface UseCrateDrawerDeletePolicyParams {
  crateCount: number;
  isDefaultCrate: boolean;
}

export const useCrateDrawerDeletePolicy = ({
  crateCount,
  isDefaultCrate,
}: UseCrateDrawerDeletePolicyParams) =>
  useMemo(
    () => resolveCrateDrawerDeletePolicy({ crateCount, isDefaultCrate }),
    [crateCount, isDefaultCrate],
  );
