import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  trackReleaseNoteSaved,
  trackReleaseRatingSaved,
} from "src/analytics/productAnalyticsEvents";
import { api } from "src/api/urls";
import {
  DiscogsCollectionQueryKeys,
  DiscogsReleaseQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { DiscogsCollection, DiscogsRelease } from "src/types";
import {
  patchCollectionQueryReleaseNotes,
  patchCollectionQueryReleaseRating,
  patchPersistedCollectionReleaseNotes,
  patchPersistedCollectionReleaseRating,
} from "src/utils/collectionCacheSync";
import type { CollectionPageParam } from "src/utils/collectionPagination";
import {
  getReleaseFolderId,
  getReleaseNotes,
  parseReleaseId,
  upsertReleaseNote,
} from "src/utils/releaseNotes";

interface ReleaseRatingMutationContext {
  collectionQueryKey: ReturnType<typeof DiscogsCollectionQueryKeys.byUsername>;
  previousQueryData:
    | InfiniteData<DiscogsCollection, CollectionPageParam>
    | undefined;
  previousRating: number;
}

export interface SaveReleaseRatingVariables {
  releaseId: number;
  instanceId: string;
  nextRating: number;
  shouldClear: boolean;
}

export interface UseSaveReleaseRatingMutationParams {
  username: string;
}

export const useSaveReleaseRatingMutation = ({
  username,
}: UseSaveReleaseRatingMutationParams) => {
  const queryClient = useQueryClient();
  const collectionQueryKey = DiscogsCollectionQueryKeys.byUsername(username);

  return useMutation<
    void,
    Error,
    SaveReleaseRatingVariables,
    ReleaseRatingMutationContext
  >({
    mutationFn: async ({ releaseId, nextRating, shouldClear }) => {
      if (shouldClear) {
        await api.clearReleaseRating({ username, releaseId });
        return;
      }

      await api.updateReleaseRating({
        username,
        releaseId,
        rating: nextRating,
      });
    },
    onMutate: async ({ releaseId, nextRating }) => {
      await queryClient.cancelQueries({ queryKey: collectionQueryKey });

      const previousQueryData =
        queryClient.getQueryData<
          InfiniteData<DiscogsCollection, CollectionPageParam>
        >(collectionQueryKey);
      const previousRating =
        previousQueryData?.pages
          .flatMap((page) => page.releases)
          .find((entry) => parseReleaseId(entry) === releaseId)?.rating ?? 0;

      queryClient.setQueryData<
        InfiniteData<DiscogsCollection, CollectionPageParam>
      >(collectionQueryKey, (current) =>
        patchCollectionQueryReleaseRating(current, releaseId, nextRating),
      );

      return {
        collectionQueryKey,
        previousQueryData,
        previousRating: typeof previousRating === "number" ? previousRating : 0,
      };
    },
    onError: async (_error, variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(
        context.collectionQueryKey,
        context.previousQueryData,
      );
      await patchPersistedCollectionReleaseRating(
        username,
        variables.releaseId,
        context.previousRating,
      );
    },
    onSuccess: async (_data, variables) => {
      trackReleaseRatingSaved(variables.instanceId);
      await patchPersistedCollectionReleaseRating(
        username,
        variables.releaseId,
        variables.nextRating,
      );
      await queryClient.invalidateQueries({ queryKey: collectionQueryKey });
      await queryClient.invalidateQueries({
        queryKey: DiscogsReleaseQueryKeys.byId(String(variables.releaseId)),
      });
    },
  });
};

interface ReleaseNotesMutationContext {
  collectionQueryKey: ReturnType<typeof DiscogsCollectionQueryKeys.byUsername>;
  previousQueryData:
    | InfiniteData<DiscogsCollection, CollectionPageParam>
    | undefined;
  previousNotes: DiscogsRelease["notes"];
}

export interface SaveReleaseNotesVariables {
  release: DiscogsRelease;
  values: Array<{ fieldId: number; value: string }>;
}

export interface UseSaveReleaseNotesMutationParams {
  username: string;
}

export const useSaveReleaseNotesMutation = ({
  username,
}: UseSaveReleaseNotesMutationParams) => {
  const queryClient = useQueryClient();
  const collectionQueryKey = DiscogsCollectionQueryKeys.byUsername(username);

  return useMutation<
    void,
    Error,
    SaveReleaseNotesVariables,
    ReleaseNotesMutationContext
  >({
    mutationFn: async ({ release, values }) => {
      const releaseId = parseReleaseId(release);

      if (releaseId === null) {
        throw new Error("Unable to resolve release id");
      }

      const instanceId = String(release.instance_id);

      for (const { fieldId, value } of values) {
        await api.updateCollectionNote({
          username,
          instanceId,
          fieldId,
          releaseId,
          folderId: getReleaseFolderId(release),
          value,
        });
      }
    },
    onMutate: async ({ release, values }) => {
      await queryClient.cancelQueries({ queryKey: collectionQueryKey });

      const previousQueryData =
        queryClient.getQueryData<
          InfiniteData<DiscogsCollection, CollectionPageParam>
        >(collectionQueryKey);
      const previousNotes = getReleaseNotes(release);
      const instanceId = String(release.instance_id);
      let nextNotes = previousNotes;

      for (const { fieldId, value } of values) {
        nextNotes = upsertReleaseNote({
          notes: nextNotes,
          fieldId,
          value,
        });
      }

      queryClient.setQueryData<
        InfiniteData<DiscogsCollection, CollectionPageParam>
      >(collectionQueryKey, (current) =>
        patchCollectionQueryReleaseNotes(current, instanceId, nextNotes),
      );

      return {
        collectionQueryKey,
        previousQueryData,
        previousNotes,
      };
    },
    onError: async (_error, variables, context) => {
      if (!context) {
        return;
      }

      queryClient.setQueryData(
        context.collectionQueryKey,
        context.previousQueryData,
      );
      await patchPersistedCollectionReleaseNotes(
        username,
        String(variables.release.instance_id),
        context.previousNotes,
      );
    },
    onSuccess: async (_data, variables, context) => {
      if (!context) {
        return;
      }

      trackReleaseNoteSaved(variables.release.instance_id);
      const instanceId = String(variables.release.instance_id);
      const nextNotes =
        queryClient
          .getQueryData<InfiniteData<DiscogsCollection, CollectionPageParam>>(
            collectionQueryKey,
          )
          ?.pages.flatMap((page) => page.releases)
          .find((entry) => String(entry.instance_id) === instanceId)?.notes ??
        context.previousNotes;

      await patchPersistedCollectionReleaseNotes(
        username,
        instanceId,
        nextNotes,
      );
      await queryClient.invalidateQueries({ queryKey: collectionQueryKey });
    },
  });
};
