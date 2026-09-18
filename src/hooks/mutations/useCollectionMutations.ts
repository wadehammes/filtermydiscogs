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
import type {
  DiscogsCollection,
  DiscogsRelease,
  DiscogsReleaseDetail,
} from "src/types";
import {
  patchCollectionQueryReleaseNotes,
  patchCollectionQueryReleaseRating,
  patchPersistedCollectionReleaseNotes,
  patchPersistedCollectionReleaseRating,
} from "src/utils/collectionCacheSync";
import type { CollectionPageParam } from "src/utils/collectionPagination";
import {
  mergeReleaseDetailWhenRefetchedCommunityIsStale,
  patchReleaseDetailCommunityForUserRatingChange,
} from "src/utils/releaseDisplay";
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
  previousReleaseDetail: DiscogsReleaseDetail | undefined;
  releaseQueryKey: ReturnType<typeof DiscogsReleaseQueryKeys.byId>;
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
    onMutate: ({ releaseId, nextRating }) => {
      void queryClient.cancelQueries({ queryKey: collectionQueryKey });

      const releaseQueryKey = DiscogsReleaseQueryKeys.byId(String(releaseId));
      const previousQueryData =
        queryClient.getQueryData<
          InfiniteData<DiscogsCollection, CollectionPageParam>
        >(collectionQueryKey);
      const previousRatingRaw =
        previousQueryData?.pages
          .flatMap((page) => page.releases)
          .find((entry) => parseReleaseId(entry) === releaseId)?.rating ?? 0;
      const previousRating =
        typeof previousRatingRaw === "number" ? previousRatingRaw : 0;
      const previousReleaseDetail =
        queryClient.getQueryData<DiscogsReleaseDetail>(releaseQueryKey);

      queryClient.setQueryData<
        InfiniteData<DiscogsCollection, CollectionPageParam>
      >(collectionQueryKey, (current) =>
        patchCollectionQueryReleaseRating(current, releaseId, nextRating),
      );

      if (previousReleaseDetail) {
        queryClient.setQueryData(
          releaseQueryKey,
          patchReleaseDetailCommunityForUserRatingChange(
            previousReleaseDetail,
            {
              previousUserRating: previousRating,
              nextUserRating: nextRating,
            },
          ),
        );
      }

      return {
        collectionQueryKey,
        previousQueryData,
        previousRating,
        previousReleaseDetail,
        releaseQueryKey,
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
      queryClient.setQueryData(
        context.releaseQueryKey,
        context.previousReleaseDetail,
      );
      await patchPersistedCollectionReleaseRating(
        username,
        variables.releaseId,
        context.previousRating,
      );
    },
    onSuccess: async (_data, variables, context) => {
      trackReleaseRatingSaved(variables.instanceId);

      const releaseId = String(variables.releaseId);
      const releaseQueryKey =
        context?.releaseQueryKey ?? DiscogsReleaseQueryKeys.byId(releaseId);
      const optimisticDetail =
        queryClient.getQueryData<DiscogsReleaseDetail>(releaseQueryKey);
      const fetchedDetail = await api
        .discogsRelease(releaseId, { bypassCache: true })
        .catch(() => null);

      if (fetchedDetail) {
        queryClient.setQueryData(
          releaseQueryKey,
          mergeReleaseDetailWhenRefetchedCommunityIsStale(
            fetchedDetail,
            optimisticDetail,
            variables.nextRating,
          ),
        );
      }

      await patchPersistedCollectionReleaseRating(
        username,
        variables.releaseId,
        variables.nextRating,
      );
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
    onMutate: ({ release, values }) => {
      void queryClient.cancelQueries({ queryKey: collectionQueryKey });

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
    },
  });
};
