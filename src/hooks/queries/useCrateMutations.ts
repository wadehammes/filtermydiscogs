import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addReleaseToCrate,
  createCrate,
  deleteCrate,
  removeReleaseFromCrate,
  syncCrates,
  updateCrate,
} from "src/api/helpers";
import type { DiscogsRelease } from "src/types";
import type {
  CratesResponse,
  CrateWithCount,
  CrateWithReleasesResponse,
  OptimisticUpdateContext,
} from "src/types/crate.types";
import { CrateQueryKeys, CratesQueryKeys } from "./querykeys.constants";

interface CreateCrateRequest {
  name: string;
}

interface UpdateCrateRequest {
  name?: string;
  is_default?: boolean;
  private?: boolean;
}

interface CreateCrateResponse {
  crate: {
    user_id: number;
    id: string;
    name: string;
    username: string | null;
    is_default: boolean;
    private: boolean;
    created_at: Date;
    updated_at: Date;
  };
}

interface UpdateCrateResponse {
  crate: {
    user_id: number;
    id: string;
    name: string;
    username: string | null;
    is_default: boolean;
    private: boolean;
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

const applyCratesListUpdate = ({
  crates,
  crateId,
  updates,
  serverCrate,
}: {
  crates: CrateWithCount[];
  crateId: string;
  updates: UpdateCrateRequest;
  serverCrate?: UpdateCrateResponse["crate"];
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
  crateUpdates: Partial<UpdateCrateResponse["crate"]>,
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

  return useMutation<CreateCrateResponse, Error, CreateCrateRequest>({
    mutationFn: async (data) => {
      return createCrate(data.name);
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
  });
};

export const useUpdateCrateMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<
    UpdateCrateResponse,
    Error,
    { crateId: string; updates: UpdateCrateRequest },
    OptimisticUpdateContext
  >({
    mutationFn: async ({ crateId, updates }) => {
      return updateCrate(crateId, updates);
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
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
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
      return deleteCrate(crateId);
    },
    onMutate: async (crateId) => {
      // Optimistically remove the crate from the cache
      queryClient.setQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
        (old) => {
          if (!old) return old;
          return {
            crates: old.crates.filter((crate) => crate.id !== crateId),
          };
        },
      );

      // Remove the crate's releases query
      queryClient.removeQueries({
        queryKey: CrateQueryKeys.byUserAndId(userId, crateId),
      });
    },
    onSuccess: async () => {
      invalidateCrateQueries(queryClient, userId);
      // Refetch to ensure we have the latest data
      await queryClient.refetchQueries({
        queryKey: CratesQueryKeys.byUserId(userId),
        exact: false,
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
      return addReleaseToCrate(crateId, release);
    },
    onMutate: async ({ crateId, release }) => {
      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      const normalizedRelease = {
        ...release,
        instance_id: String(release.instance_id),
      };
      const releaseId = String(release.instance_id);

      queryClient.setQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, crateId),
        (old) => {
          if (!old) {
            return {
              crate: {
                user_id: parseInt(userId || "0", 10),
                id: crateId,
                name: "",
                username: null,
                is_default: false,
                private: true,
                created_at: new Date(),
                updated_at: new Date(),
              },
              releases: [normalizedRelease],
            };
          }

          const alreadyExists = old.releases.some(
            (r: DiscogsRelease) => String(r.instance_id) === releaseId,
          );

          if (alreadyExists) {
            return old;
          }

          return {
            ...old,
            releases: [normalizedRelease, ...old.releases],
          };
        },
      );

      queryClient.setQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
        (old) => {
          if (!old) return old;
          return {
            crates: old.crates.map((crate) => {
              if (crate.id === crateId) {
                return {
                  ...crate,
                  releaseCount: (crate.releaseCount || 0) + 1,
                };
              }
              return crate;
            }),
          };
        },
      );

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
    onSuccess: () => {
      // Don't invalidate - the optimistic update is already correct
      // The query will naturally refetch when it becomes stale or on navigation
      // This prevents race conditions where a refetch overwrites the optimistic update
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
      return removeReleaseFromCrate(crateId, releaseId);
    },
    onMutate: async ({ crateId, releaseId }) => {
      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      queryClient.setQueryData<CrateWithReleasesResponse>(
        CrateQueryKeys.byUserAndId(userId, crateId),
        (old) => {
          if (!old) return old;
          return {
            ...old,
            releases: old.releases.filter(
              (r: DiscogsRelease) =>
                String(r.instance_id) !== String(releaseId),
            ),
          };
        },
      );

      queryClient.setQueryData<CratesResponse>(
        CratesQueryKeys.byUserId(userId),
        (old) => {
          if (!old) return old;
          return {
            crates: old.crates.map((crate) => {
              if (crate.id === crateId) {
                return {
                  ...crate,
                  releaseCount: Math.max((crate.releaseCount || 0) - 1, 0),
                };
              }
              return crate;
            }),
          };
        },
      );

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
    onSuccess: () => {
      // Don't invalidate - the optimistic update is already correct
      // The query will naturally refetch when it becomes stale or on navigation
      // This prevents race conditions where a refetch overwrites the optimistic update
    },
  });
};

export const useSyncCratesMutation = (userId: string | null) => {
  const queryClient = useQueryClient();

  return useMutation<SyncCratesResponse, Error, SyncCratesRequest>({
    mutationFn: async (data) => {
      return syncCrates(data.collectionInstanceIds);
    },
    onSuccess: () => {
      invalidateCrateQueries(queryClient, userId);
    },
  });
};
