import { useMutation, useQueryClient } from "@tanstack/react-query";
import { trackCrateLayoutUpdated } from "src/analytics/productAnalyticsEvents";
import { api } from "src/api/urls";
import {
  CrateQueryKeys,
  CratesQueryKeys,
  ReleaseCrateMembershipQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import {
  getPrependCrateLayoutSortOrder,
  splitCrateLayoutItemsForCache,
} from "src/lib/crate-layout";
import type { DiscogsRelease } from "src/types";
import type {
  CrateLayoutItem,
  CrateLayoutPutRequest,
  CratesResponse,
  CrateUpdatePayload,
  CrateWithCount,
  CrateWithReleasesResponse,
  OptimisticUpdateContext,
  ReleaseCrateMembershipResponse,
} from "src/types/crate.types";
import {
  patchReleaseCrateMembershipCache,
  setReleaseCrateMembershipCache,
} from "src/utils/releaseCrateMembershipCache";
import { toast } from "src/utils/toast";

interface CreateCrateRequest {
  name: string;
}

interface UpdateCrateRequest extends Partial<CrateUpdatePayload> {}

interface CrateMutationResponse {
  crate: CrateUpdatePayload & {
    user_id: number;
    id: string;
    username: string | null;
    created_at: Date;
    updated_at: Date;
  };
}

interface SyncCratesRequest {
  collectionInstanceIds: string[];
}

interface SyncCratesResponse {
  success: boolean;
  removedCount: number;
}

const getUpdateCrateErrorTitle = (updates: UpdateCrateRequest): string => {
  if (updates.is_default) {
    return "Failed to make crate default";
  }

  if (updates.private !== undefined) {
    return "Failed to update crate privacy";
  }

  if (updates.packed_enabled !== undefined) {
    return "Failed to update gig packing checklist setting";
  }

  if (updates.name !== undefined) {
    return "Failed to rename crate";
  }

  if (updates.notes !== undefined) {
    return "Failed to update crate notes";
  }

  return "Failed to update crate";
};

const showCrateMutationError = (title: string, error: Error) => {
  toast.error(title, { description: error.message });
};

const invalidateCrateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId?: string,
) => {
  if (userId) {
    queryClient.invalidateQueries({
      queryKey: CratesQueryKeys.byUserId(userId),
    });

    if (crateId) {
      queryClient.invalidateQueries({
        queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: CrateQueryKeys.byUserId(userId),
      });
    }
  } else {
    queryClient.invalidateQueries({
      queryKey: CratesQueryKeys.all(),
    });
    queryClient.invalidateQueries({
      queryKey: CrateQueryKeys.all(),
    });
  }
};

const cancelCrateDetailQuery = async (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId: string,
) => {
  await queryClient.cancelQueries({
    queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
  });
};

const getCrateQuerySnapshots = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId?: string,
) => {
  const previousCrateData = crateId
    ? queryClient.getQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, crateId),
      )
    : undefined;
  const previousCratesData = queryClient.getQueryData<CratesResponse>(
    CratesQueryKeys.byUserId(userId),
  );
  return { previousCrateData, previousCratesData };
};

const rollbackOptimisticUpdate = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  context: OptimisticUpdateContext | undefined,
  crateId?: string,
) => {
  if (context?.previousCrateData && crateId) {
    queryClient.setQueryData(
      CrateQueryKeys.byUserAndId(userId, crateId),
      context.previousCrateData,
    );
  }
  if (context?.previousCratesData) {
    queryClient.setQueryData(
      CratesQueryKeys.byUserId(userId),
      context.previousCratesData,
    );
  }
};

const applyClearPackedToCrateCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId: string,
) => {
  queryClient.setQueryData<CrateWithReleasesResponse>(
    CrateQueryKeys.byUserAndId(userId, crateId),
    (old) => {
      if (!old) return old;

      return {
        ...old,
        releases: old.releases.map((item) => ({
          ...item,
          found_at: null,
        })),
      };
    },
  );
};

const applyFoundAtToCrateRelease = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId: string,
  releaseId: string,
  foundAt: string | null,
) => {
  queryClient.setQueryData<CrateWithReleasesResponse>(
    CrateQueryKeys.byUserAndId(userId, crateId),
    (old) => {
      if (!old) return old;

      return {
        ...old,
        releases: old.releases.map((item) =>
          String(item.release.instance_id) === String(releaseId)
            ? {
                ...item,
                found_at: foundAt,
              }
            : item,
        ),
      };
    },
  );
};

const applyCratesListUpdate = ({
  crates,
  crateId,
  updates,
  serverCrate,
}: {
  crates: CrateWithCount[];
  crateId: string;
  updates: UpdateCrateRequest;
  serverCrate?: CrateMutationResponse["crate"];
}): CrateWithCount[] =>
  crates.map((crate) => {
    if (crate.id === crateId) {
      return {
        ...crate,
        ...(serverCrate ?? updates),
        releaseCount: crate.releaseCount ?? 0,
      } as CrateWithCount;
    }

    if (updates.is_default) {
      return { ...crate, is_default: false };
    }

    return crate;
  });

const mergeCrateDetailCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId: string,
  crateUpdates: Partial<CrateMutationResponse["crate"]>,
) => {
  queryClient.setQueryData<CrateWithReleasesResponse>(
    CrateQueryKeys.byUserAndId(userId, crateId),
    (old) => {
      if (!old) return old;

      return {
        ...old,
        crate: {
          ...old.crate,
          ...crateUpdates,
        },
      };
    },
  );
};

export const useCreateCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<CrateMutationResponse, Error, CreateCrateRequest>({
    mutationFn: async (data) => {
      return api.createCrate(data.name);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
        (old) => {
          if (!old) {
            return {
              crates: [
                {
                  ...data.crate,
                  releaseCount: 0,
                } as CrateWithCount,
              ],
            };
          }
          return {
            crates: [
              ...old.crates,
              { ...data.crate, releaseCount: 0 } as CrateWithCount,
            ],
          };
        },
      );
    },
    onError: (error) => {
      showCrateMutationError("Failed to create crate", error);
    },
  });
};

export const useUpdateCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    CrateMutationResponse,
    Error,
    { crateId: string; updates: UpdateCrateRequest },
    OptimisticUpdateContext
  >({
    mutationFn: async ({ crateId, updates }) => {
      return api.updateCrate(crateId, updates);
    },
    onMutate: async ({ crateId, updates }) => {
      await queryClient.cancelQueries({
        queryKey: CratesQueryKeys.byUserId(userId),
      });
      await queryClient.cancelQueries({
        queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
      });

      const previousCrates = queryClient.getQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
      );
      const previousCrateData =
        queryClient.getQueryData<CrateWithReleasesResponse>(
          CrateQueryKeys.byUserAndId(userId, crateId),
        );

      if (previousCrates) {
        queryClient.setQueryData<CratesResponse>(
          CratesQueryKeys.byUserId(userId),
          {
            crates: applyCratesListUpdate({
              crates: previousCrates.crates,
              crateId,
              updates,
            }),
          },
        );
      }

      mergeCrateDetailCache(queryClient, userId, crateId, updates);

      return { previousCratesData: previousCrates, previousCrateData };
    },
    onError: (error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      showCrateMutationError(
        getUpdateCrateErrorTitle(variables.updates),
        error,
      );
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
        (old) => {
          if (!old) return old;

          return {
            crates: applyCratesListUpdate({
              crates: old.crates,
              crateId: variables.crateId,
              updates: variables.updates,
              serverCrate: data.crate,
            }),
          };
        },
      );

      mergeCrateDetailCache(queryClient, userId, variables.crateId, data.crate);
    },
  });
};

export const useDeleteCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: async (crateId) => {
      return api.deleteCrate(crateId);
    },
    onMutate: async (crateId) => {
      queryClient.setQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
        (old) => {
          if (!old) return old;
          return {
            crates: old.crates.filter((crate) => crate.id !== crateId),
          };
        },
      );

      queryClient.removeQueries({
        queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
      });
    },
    onSuccess: async () => {
      invalidateCrateQueries(queryClient, userId);
      await queryClient.refetchQueries({
        queryKey: CratesQueryKeys.byUserId(userId),
        exact: false,
      });
    },
    onError: async (error) => {
      showCrateMutationError("Failed to delete crate", error);
      await queryClient.refetchQueries({
        queryKey: CratesQueryKeys.byUserId(userId),
      });
    },
  });
};

export const useAddReleaseToCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { crateId: string; release: DiscogsRelease },
    OptimisticUpdateContext
  >({
    mutationKey: ["addReleaseToCrate"],
    mutationFn: async ({ crateId, release }) => {
      return api.addReleaseToCrate(crateId, release);
    },
    onMutate: async ({ crateId, release }) => {
      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      applyAddReleaseToCrateCache({
        queryClient,
        userId,
        crateId,
        release,
      });

      patchReleaseCrateMembershipCache({
        queryClient,
        userId,
        instanceId: String(release.instance_id),
        crateId,
        member: true,
      });

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
  });
};

export const useRemoveReleaseFromCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean },
    Error,
    { crateId: string; releaseId: string },
    OptimisticUpdateContext
  >({
    mutationKey: ["removeReleaseFromCrate"],
    mutationFn: async ({ crateId, releaseId }) => {
      return api.removeReleaseFromCrate(crateId, releaseId);
    },
    onMutate: async ({ crateId, releaseId }) => {
      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      applyRemoveReleaseFromCrateCache({
        queryClient,
        userId,
        crateId,
        releaseId,
      });

      patchReleaseCrateMembershipCache({
        queryClient,
        userId,
        instanceId: releaseId,
        crateId,
        member: false,
      });

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
  });
};

interface SetReleaseCrateMembershipContext {
  previousCrateSnapshots: Record<string, CrateWithReleasesResponse | undefined>;
  previousCratesData?: CratesResponse | undefined;
  previousMembership?: ReleaseCrateMembershipResponse | undefined;
}

const applyAddReleaseToCrateCache = ({
  queryClient,
  userId,
  crateId,
  release,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  userId: string | null;
  crateId: string;
  release: DiscogsRelease;
}) => {
  const normalizedRelease = {
    ...release,
    instance_id: String(release.instance_id),
  };
  const releaseId = normalizedRelease.instance_id;
  const crateDetailKey = CrateQueryKeys.byUserAndId(userId, crateId);
  const existingDetail =
    queryClient.getQueryData<CrateWithReleasesResponse>(crateDetailKey);

  if (
    existingDetail?.releases.some(
      (item) => String(item.release.instance_id) === releaseId,
    )
  ) {
    return;
  }

  queryClient.setQueryData<CratesResponse>(
    CratesQueryKeys.byUserId(userId),
    (old) => {
      if (!old) return old;
      return {
        crates: old.crates.map((crate) => {
          if (crate.id === crateId) {
            return {
              ...crate,
              releaseCount: (crate.releaseCount ?? 0) + 1,
            };
          }
          return crate;
        }),
      };
    },
  );

  if (!existingDetail) {
    void queryClient.invalidateQueries({ queryKey: crateDetailKey });
    return;
  }

  queryClient.setQueryData<CrateWithReleasesResponse>(crateDetailKey, (old) => {
    if (!old) {
      return old;
    }

    const nextSortOrder = getPrependCrateLayoutSortOrder([
      ...old.releases.map((item) => item.sort_order ?? 0),
      ...(old.markers ?? []).map((marker) => marker.sort_order),
    ]);

    return {
      ...old,
      releases: [
        {
          release: normalizedRelease,
          found_at: null,
          sort_order: nextSortOrder,
        },
        ...old.releases,
      ],
    };
  });
};

const applyRemoveReleaseFromCrateCache = ({
  queryClient,
  userId,
  crateId,
  releaseId,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  userId: string | null;
  crateId: string;
  releaseId: string;
}) => {
  const crateDetailKey = CrateQueryKeys.byUserAndId(userId, crateId);
  const existingDetail =
    queryClient.getQueryData<CrateWithReleasesResponse>(crateDetailKey);
  const normalizedReleaseId = String(releaseId);
  const wasInDetail =
    existingDetail?.releases.some(
      (item) => String(item.release.instance_id) === normalizedReleaseId,
    ) ?? false;

  if (existingDetail && !wasInDetail) {
    return;
  }

  queryClient.setQueryData<CratesResponse>(
    CratesQueryKeys.byUserId(userId),
    (old) => {
      if (!old) return old;
      return {
        crates: old.crates.map((crate) => {
          if (crate.id === crateId) {
            return {
              ...crate,
              releaseCount: Math.max((crate.releaseCount ?? 0) - 1, 0),
            };
          }
          return crate;
        }),
      };
    },
  );

  if (!existingDetail) {
    void queryClient.invalidateQueries({ queryKey: crateDetailKey });
    return;
  }

  queryClient.setQueryData<CrateWithReleasesResponse>(crateDetailKey, (old) => {
    if (!old) return old;
    return {
      ...old,
      releases: old.releases.filter(
        (item) => String(item.release.instance_id) !== normalizedReleaseId,
      ),
    };
  });
};

export const useSetReleaseCrateMembershipMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; crateIds: string[] },
    Error,
    { crateIds: string[]; release: DiscogsRelease },
    SetReleaseCrateMembershipContext
  >({
    mutationKey: ["setReleaseCrateMembership"],
    mutationFn: async ({ crateIds, release }) => {
      return api.setReleaseCrateMembership(String(release.instance_id), {
        crateIds,
        release,
      });
    },
    onMutate: async ({ crateIds, release }) => {
      const releaseId = String(release.instance_id);
      const targetSet = new Set(crateIds);
      const previousMembership =
        queryClient.getQueryData<ReleaseCrateMembershipResponse>(
          ReleaseCrateMembershipQueryKeys.byUserAndInstance(userId, releaseId),
        );
      const currentIds = new Set(previousMembership?.crateIds ?? []);
      const affectedCrateIds = new Set([...currentIds, ...targetSet]);
      const previousCrateSnapshots: SetReleaseCrateMembershipContext["previousCrateSnapshots"] =
        {};

      for (const crateId of affectedCrateIds) {
        previousCrateSnapshots[crateId] = queryClient.getQueryData(
          CrateQueryKeys.byUserAndId(userId, crateId),
        );
      }

      const previousCratesData = queryClient.getQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
      );

      setReleaseCrateMembershipCache({
        queryClient,
        userId,
        instanceId: releaseId,
        crateIds,
      });

      for (const crateId of affectedCrateIds) {
        const shouldBeMember = targetSet.has(crateId);
        const wasMember = currentIds.has(crateId);

        if (shouldBeMember && !wasMember) {
          applyAddReleaseToCrateCache({
            queryClient,
            userId,
            crateId,
            release,
          });
        } else if (!shouldBeMember && wasMember) {
          applyRemoveReleaseFromCrateCache({
            queryClient,
            userId,
            crateId,
            releaseId,
          });
        }
      }

      return {
        previousCrateSnapshots,
        previousCratesData,
        previousMembership,
      };
    },
    onError: (_error, variables, context) => {
      if (context?.previousMembership !== undefined) {
        queryClient.setQueryData(
          ReleaseCrateMembershipQueryKeys.byUserAndInstance(
            userId,
            String(variables.release.instance_id),
          ),
          context.previousMembership,
        );
      }

      for (const [crateId, snapshot] of Object.entries(
        context?.previousCrateSnapshots ?? {},
      )) {
        if (snapshot) {
          queryClient.setQueryData(
            CrateQueryKeys.byUserAndId(userId, crateId),
            snapshot,
          );
        }
      }

      if (context?.previousCratesData) {
        queryClient.setQueryData(
          CratesQueryKeys.byUserId(userId),
          context.previousCratesData,
        );
      }
    },
  });
};

export const useSyncCratesMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<SyncCratesResponse, Error, SyncCratesRequest>({
    mutationFn: async (data) => {
      return api.syncCrates(data.collectionInstanceIds);
    },
    onSuccess: () => {
      invalidateCrateQueries(queryClient, userId);
    },
  });
};

export const useSetReleasePackedInCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; found_at: string | null },
    Error,
    { crateId: string; releaseId: string; found: boolean },
    OptimisticUpdateContext
  >({
    mutationKey: ["setReleasePackedInCrate"],
    mutationFn: async ({ crateId, releaseId, found }) => {
      return api.setReleasePackedInCrate(crateId, releaseId, found);
    },
    onMutate: async ({ crateId, releaseId, found }) => {
      await cancelCrateDetailQuery(queryClient, userId, crateId);

      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      applyFoundAtToCrateRelease(
        queryClient,
        userId,
        crateId,
        releaseId,
        found ? new Date().toISOString() : null,
      );

      return { previousCrateData, previousCratesData };
    },
    onError: (error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      showCrateMutationError("Failed to update packed status", error);
    },
    onSuccess: (data, { crateId, releaseId }) => {
      applyFoundAtToCrateRelease(
        queryClient,
        userId,
        crateId,
        releaseId,
        data.found_at,
      );
    },
  });
};

export const useClearAllPackedInCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    { success: boolean; cleared_count: number },
    Error,
    { crateId: string },
    OptimisticUpdateContext
  >({
    mutationKey: ["clearAllPackedInCrate"],
    mutationFn: async ({ crateId }) => {
      return api.clearAllPackedInCrate(crateId);
    },
    onMutate: async ({ crateId }) => {
      await cancelCrateDetailQuery(queryClient, userId, crateId);

      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      applyClearPackedToCrateCache(queryClient, userId, crateId);

      return { previousCrateData, previousCratesData };
    },
    onError: (error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      showCrateMutationError("Failed to clear packed items", error);
    },
    onSuccess: (_data, { crateId }) => {
      applyClearPackedToCrateCache(queryClient, userId, crateId);
    },
  });
};

interface UpdateCrateLayoutRequest {
  crateId: string;
  layout: CrateLayoutPutRequest;
  optimisticLayoutItems: CrateLayoutItem[];
}

export const useUpdateCrateLayoutMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    {
      success: boolean;
      releases: CrateWithReleasesResponse["releases"];
      markers: CrateWithReleasesResponse["markers"];
    },
    Error,
    UpdateCrateLayoutRequest,
    OptimisticUpdateContext
  >({
    mutationKey: ["updateCrateLayout"],
    mutationFn: async ({ crateId, layout }) => {
      return api.updateCrateLayout(crateId, layout);
    },
    onMutate: async ({ crateId, optimisticLayoutItems }) => {
      await cancelCrateDetailQuery(queryClient, userId, crateId);

      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      queryClient.setQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, crateId),
        (old) => {
          if (!old) return old;

          const { releases, markers } = splitCrateLayoutItemsForCache(
            optimisticLayoutItems,
          );

          return {
            ...old,
            releases,
            markers,
          };
        },
      );

      return { previousCrateData, previousCratesData };
    },
    onError: (error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      showCrateMutationError("Failed to update crate layout", error);
    },
    onSuccess: (data, { crateId }) => {
      trackCrateLayoutUpdated(crateId);
      queryClient.setQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, crateId),
        (old) => {
          if (!old) return old;

          return {
            ...old,
            releases: data.releases,
            markers: data.markers,
          };
        },
      );
    },
  });
};
