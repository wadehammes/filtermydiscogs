import type { QueryClient } from "@tanstack/react-query";
import { ReleaseCrateMembershipQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { ReleaseCrateMembershipResponse } from "src/types/crate.types";

export const patchReleaseCrateMembershipCache = ({
  queryClient,
  userId,
  instanceId,
  crateId,
  member,
}: {
  queryClient: QueryClient;
  userId: string | null;
  instanceId: string | number;
  crateId: string;
  member: boolean;
}) => {
  const normalizedInstanceId = String(instanceId);

  queryClient.setQueryData<ReleaseCrateMembershipResponse>(
    ReleaseCrateMembershipQueryKeys.byUserAndInstance(
      userId,
      normalizedInstanceId,
    ),
    (old) => {
      const nextIds = new Set(old?.crateIds ?? []);

      if (member) {
        nextIds.add(crateId);
      } else {
        nextIds.delete(crateId);
      }

      return { crateIds: Array.from(nextIds) };
    },
  );
};

export const setReleaseCrateMembershipCache = ({
  queryClient,
  userId,
  instanceId,
  crateIds,
}: {
  queryClient: QueryClient;
  userId: string | null;
  instanceId: string | number;
  crateIds: string[];
}) => {
  const normalizedInstanceId = String(instanceId);

  queryClient.setQueryData<ReleaseCrateMembershipResponse>(
    ReleaseCrateMembershipQueryKeys.byUserAndInstance(
      userId,
      normalizedInstanceId,
    ),
    { crateIds: [...crateIds] },
  );
};
