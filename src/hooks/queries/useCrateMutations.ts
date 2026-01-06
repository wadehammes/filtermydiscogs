import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  addReleaseToCrate,
  createCrate,
  deleteCrate,
  removeReleaseFromCrate,
  syncCrates,
  updateCrate,
} from "src/api/helpers";
import { getUserIdFromCookies } from "src/services/auth.service";
import type { DiscogsRelease } from "src/types";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
  OptimisticUpdateContext,
} from "src/types/crate.types";

interface CreateCrateRequest {
  name: string;
}

interface UpdateCrateRequest {
  name?: string;
  is_default?: boolean;
}

interface CreateCrateResponse {
  crate: {
    user_id: number;
    id: string;
    name: string;
    is_default: boolean;
    created_at: Date;
    updated_at: Date;
  };
}

interface UpdateCrateResponse {
  crate: {
    user_id: number;
    id: string;
    name: string;
    is_default: boolean;
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
      queryKey: ["crates", userId],
    });

    if (crateId) {
      queryClient.invalidateQueries({
        queryKey: ["crate", userId, crateId],
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: ["crate", userId],
      });
    }
  } else {
    queryClient.invalidateQueries({
      queryKey: ["crates"],
    });
    queryClient.invalidateQueries({
      queryKey: ["crate"],
    });
  }
};

const getCrateQuerySnapshots = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId?: string,
) => {
  const previousCrateData = crateId
    ? queryClient.getQueryData<CrateWithReleasesResponse>([
        "crate",
        userId,
        crateId,
      ])
    : undefined;
  const previousCratesData = queryClient.getQueryData<CratesResponse>([
    "crates",
    userId,
  ]);
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
      ["crate", userId, crateId],
      context.previousCrateData,
    );
  }
  if (context?.previousCratesData) {
    queryClient.setQueryData(["crates", userId], context.previousCratesData);
  }
};

export const useCreateCrateMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

  return useMutation<CreateCrateResponse, Error, CreateCrateRequest>({
    mutationFn: async (data) => {
      return createCrate(data.name);
    },
    onSuccess: (data) => {
      queryClient.setQueryData<CratesResponse>(["crates", userId], (old) => {
        if (!old) {
          return {
            crates: [
              {
                ...data.crate,
                releaseCount: 0,
              },
            ],
          };
        }
        return {
          crates: [...old.crates, { ...data.crate, releaseCount: 0 }],
        };
      });
    },
  });
};

export const useUpdateCrateMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

  return useMutation<
    UpdateCrateResponse,
    Error,
    { crateId: string; updates: UpdateCrateRequest }
  >({
    mutationFn: async ({ crateId, updates }) => {
      return updateCrate(crateId, updates);
    },
    onSuccess: async (_, variables) => {
      invalidateCrateQueries(queryClient, userId, variables.crateId);
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["crates", userId],
          exact: false,
        }),
        queryClient.refetchQueries({
          queryKey: ["crate", userId, variables.crateId],
          exact: false,
        }),
      ]);
    },
  });
};

export const useDeleteCrateMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

  return useMutation<void, Error, string>({
    mutationFn: async (crateId) => {
      return deleteCrate(crateId);
    },
    onSuccess: () => {
      invalidateCrateQueries(queryClient, userId);
    },
  });
};

export const useAddReleaseToCrateMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

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
        ["crate", userId, crateId],
        (old) => {
          if (!old) {
            return {
              crate: {
                user_id: parseInt(userId || "0", 10),
                id: crateId,
                name: "",
                is_default: false,
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

      queryClient.setQueryData<CratesResponse>(["crates", userId], (old) => {
        if (!old) return old;
        return {
          crates: old.crates.map((crate) => {
            if (crate.id === crateId) {
              return { ...crate, releaseCount: (crate.releaseCount || 0) + 1 };
            }
            return crate;
          }),
        };
      });

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
  });
};

export const useRemoveReleaseFromCrateMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

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
        ["crate", userId, crateId],
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

      queryClient.setQueryData<CratesResponse>(["crates", userId], (old) => {
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
      });

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
  });
};

export const useSyncCratesMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

  return useMutation<SyncCratesResponse, Error, SyncCratesRequest>({
    mutationFn: async (data) => {
      return syncCrates(data.collectionInstanceIds);
    },
    onSuccess: () => {
      invalidateCrateQueries(queryClient, userId);
    },
  });
};
