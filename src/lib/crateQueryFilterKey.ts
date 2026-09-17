import { CrateQueryKeys } from "src/hooks/queries/querykeys.constants";

export const crateQueryFilterKey = (
  userId: string | number | null,
  crateId?: string | null,
) => {
  if (crateId != null && crateId !== "") {
    return CrateQueryKeys.byUserAndId(userId, crateId);
  }

  return CrateQueryKeys.byUserId(userId);
};
