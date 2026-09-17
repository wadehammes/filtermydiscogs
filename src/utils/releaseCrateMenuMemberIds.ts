export const buildReleaseCrateMenuMemberIds = ({
  membershipCrateIds,
  activeCrateId,
  activeCrateInstanceIds,
  instanceId,
}: {
  membershipCrateIds: string[];
  activeCrateId: string | null;
  activeCrateInstanceIds: ReadonlySet<string>;
  instanceId: string;
}): Set<string> => {
  const ids = new Set(membershipCrateIds);

  if (activeCrateInstanceIds.has(instanceId) && activeCrateId) {
    ids.add(activeCrateId);
  }

  return ids;
};
