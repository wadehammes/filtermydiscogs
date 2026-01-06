import { useMutation, useQueryClient } from "@tanstack/react-query";
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

const handleApiError = async (
  response: Response,
  defaultMessage: string,
): Promise<string> => {
  try {
    const error = await response.json();
    return error.error || defaultMessage;
  } catch {
    const text = await response.text();
    return text || defaultMessage;
  }
};

const invalidateCrateQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId?: string,
) => {
  if (userId) {
    // Invalidate with specific userId
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
    // Fallback: invalidate all crate queries if userId is null
    queryClient.invalidateQueries({
      queryKey: ["crates"],
    });
    queryClient.invalidateQueries({
      queryKey: ["crate"],
    });
  }
};

const cancelCrateQueries = async (
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | null,
  crateId?: string,
) => {
  if (crateId) {
    await queryClient.cancelQueries({
      queryKey: ["crate", userId, crateId],
    });
  }
  await queryClient.cancelQueries({
    queryKey: ["crates", userId],
  });
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
      const response = await fetch("/api/crates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "Failed to create crate",
        );
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      invalidateCrateQueries(queryClient, userId);
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
      const response = await fetch(`/api/crates/${crateId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "Failed to update crate",
        );
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      invalidateCrateQueries(queryClient, userId, variables.crateId);

      // Force refetch to ensure UI updates
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
      const response = await fetch(`/api/crates/${crateId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "Failed to delete crate",
        );
        throw new Error(errorMessage);
      }
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
    mutationFn: async ({ crateId, release }) => {
      const response = await fetch(`/api/crates/${crateId}/releases`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(release),
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "Failed to add release to crate",
        );
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onMutate: async ({ crateId, release }) => {
      await cancelCrateQueries(queryClient, userId, crateId);
      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      if (previousCrateData) {
        const normalizedRelease = {
          ...release,
          instance_id: String(release.instance_id),
        };
        // Check if release is already in the list (prevent duplicates)
        const releaseId = String(release.instance_id);
        const alreadyExists = previousCrateData.releases.some(
          (r: DiscogsRelease) => String(r.instance_id) === releaseId,
        );

        if (!alreadyExists) {
          queryClient.setQueryData<CrateWithReleasesResponse>(
            ["crate", userId, crateId],
            {
              ...previousCrateData,
              releases: [normalizedRelease, ...previousCrateData.releases],
            },
          );
        }
      }

      if (previousCratesData) {
        queryClient.setQueryData<CratesResponse>(["crates", userId], {
          crates: previousCratesData.crates.map((crate) => {
            if (crate.id === crateId) {
              return { ...crate, releaseCount: (crate.releaseCount || 0) + 1 };
            }
            return crate;
          }),
        });
      }

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      // Invalidate to ensure we get fresh data after error
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
    onSuccess: async (_data, variables) => {
      // Small delay to ensure server has fully processed the change
      // This prevents race conditions where refetch happens before server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Explicitly refetch to ensure UI matches server state
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["crate", userId, variables.crateId],
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: ["crates", userId],
          exact: true,
        }),
      ]);
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
    mutationFn: async ({ crateId, releaseId }) => {
      const response = await fetch(
        `/api/crates/${crateId}/releases/${releaseId}`,
        {
          method: "DELETE",
          credentials: "include",
        },
      );

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "Failed to remove release from crate",
        );
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onMutate: async ({ crateId, releaseId }) => {
      await cancelCrateQueries(queryClient, userId, crateId);
      const { previousCrateData, previousCratesData } = getCrateQuerySnapshots(
        queryClient,
        userId,
        crateId,
      );

      if (previousCrateData) {
        queryClient.setQueryData<CrateWithReleasesResponse>(
          ["crate", userId, crateId],
          {
            ...previousCrateData,
            releases: previousCrateData.releases.filter(
              (r: DiscogsRelease) =>
                String(r.instance_id) !== String(releaseId),
            ),
          },
        );
      }

      if (previousCratesData) {
        queryClient.setQueryData<CratesResponse>(["crates", userId], {
          crates: previousCratesData.crates.map((crate) => {
            if (crate.id === crateId) {
              return {
                ...crate,
                releaseCount: Math.max((crate.releaseCount || 0) - 1, 0),
              };
            }
            return crate;
          }),
        });
      }

      return { previousCrateData, previousCratesData };
    },
    onError: (_error, variables, context) => {
      rollbackOptimisticUpdate(queryClient, userId, context, variables.crateId);
      // Invalidate to ensure we get fresh data after error
      invalidateCrateQueries(queryClient, userId, variables.crateId);
    },
    onSuccess: async (_data, variables) => {
      // Small delay to ensure server has fully processed the change
      // This prevents race conditions where refetch happens before server is ready
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Explicitly refetch to ensure UI matches server state
      await Promise.all([
        queryClient.refetchQueries({
          queryKey: ["crate", userId, variables.crateId],
          exact: true,
        }),
        queryClient.refetchQueries({
          queryKey: ["crates", userId],
          exact: true,
        }),
      ]);
    },
  });
};

export const useSyncCratesMutation = () => {
  const queryClient = useQueryClient();
  const userId = getUserIdFromCookies();

  return useMutation<SyncCratesResponse, Error, SyncCratesRequest>({
    mutationFn: async (data) => {
      const response = await fetch("/api/crates/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorMessage = await handleApiError(
          response,
          "Failed to sync crates",
        );
        throw new Error(errorMessage);
      }

      return response.json();
    },
    onSuccess: () => {
      invalidateCrateQueries(queryClient, userId);
    },
  });
};
