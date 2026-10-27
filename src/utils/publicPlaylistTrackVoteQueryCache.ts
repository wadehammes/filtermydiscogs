import type { QueryClient } from "@tanstack/react-query";
import type { PlaylistTrackVoteDirection } from "src/constants/playlistTrackVote.constants";
import {
  PlaylistQueryKeys,
  PublicPlaylistQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type {
  PlaylistDetail,
  PlaylistTrackRow,
  PlaylistTrackVoteResponse,
  PublicPlaylistResponse,
} from "src/types/playlist.types";
import { computePlaylistTrackVoteOptimisticState } from "src/utils/playlistTrackVote";

export type PublicPlaylistTrackVoteOptimisticContext = {
  publicQueryKey: ReturnType<typeof PublicPlaylistQueryKeys.byId>;
  previousPublic: PublicPlaylistResponse | undefined;
  ownerQueryKey?: ReturnType<typeof PlaylistQueryKeys.byUserAndId>;
  previousOwner?: PlaylistDetail;
};

const patchTrackVoteFields = (
  track: PlaylistTrackRow,
  fields: Pick<PlaylistTrackRow, "upCount" | "downCount"> & {
    viewerVote?: PlaylistTrackRow["viewerVote"];
  },
): PlaylistTrackRow => ({
  ...track,
  upCount: fields.upCount,
  downCount: fields.downCount,
  ...(fields.viewerVote !== undefined ? { viewerVote: fields.viewerVote } : {}),
});

export const applyOptimisticPlaylistTrackVoteInQueryCaches = (
  queryClient: QueryClient,
  playlistId: string,
  trackKey: string,
  requestedVote: PlaylistTrackVoteDirection,
  ownerUserId?: number | null,
  priorViewerVote?: PlaylistTrackRow["viewerVote"],
): PublicPlaylistTrackVoteOptimisticContext => {
  const publicQueryKey = PublicPlaylistQueryKeys.byId(playlistId);
  const previousPublic =
    queryClient.getQueryData<PublicPlaylistResponse>(publicQueryKey);

  if (previousPublic) {
    queryClient.setQueryData<PublicPlaylistResponse>(publicQueryKey, {
      ...previousPublic,
      tracks: previousPublic.tracks.map((track) => {
        if (track.track_key !== trackKey) {
          return track;
        }

        return patchTrackVoteFields(
          track,
          computePlaylistTrackVoteOptimisticState(
            {
              ...track,
              viewerVote: priorViewerVote ?? track.viewerVote ?? null,
            },
            requestedVote,
          ),
        );
      }),
    });
  }

  const context: PublicPlaylistTrackVoteOptimisticContext = {
    publicQueryKey,
    previousPublic,
  };

  if (ownerUserId == null) {
    return context;
  }

  const ownerQueryKey = PlaylistQueryKeys.byUserAndId(ownerUserId, playlistId);
  const previousOwner = queryClient.getQueryData<PlaylistDetail>(ownerQueryKey);
  context.ownerQueryKey = ownerQueryKey;
  if (previousOwner !== undefined) {
    context.previousOwner = previousOwner;
  }

  if (previousOwner) {
    queryClient.setQueryData<PlaylistDetail>(ownerQueryKey, {
      ...previousOwner,
      tracks: previousOwner.tracks.map((track) => {
        if (track.track_key !== trackKey) {
          return track;
        }

        const { upCount, downCount } = computePlaylistTrackVoteOptimisticState(
          {
            ...track,
            viewerVote: priorViewerVote ?? track.viewerVote ?? null,
          },
          requestedVote,
        );

        return patchTrackVoteFields(track, { upCount, downCount });
      }),
    });
  }

  return context;
};

export const rollbackOptimisticPlaylistTrackVoteInQueryCaches = (
  queryClient: QueryClient,
  context: PublicPlaylistTrackVoteOptimisticContext | undefined,
): void => {
  if (!context) {
    return;
  }

  if (context.previousPublic !== undefined) {
    queryClient.setQueryData(context.publicQueryKey, context.previousPublic);
  }

  if (context.ownerQueryKey && context.previousOwner !== undefined) {
    queryClient.setQueryData(context.ownerQueryKey, context.previousOwner);
  }
};

export const mergePublicPlaylistResponsePreservingLocalVotes = (
  local: PublicPlaylistResponse,
  server: PublicPlaylistResponse,
): PublicPlaylistResponse => ({
  ...server,
  tracks: server.tracks.map((track) => {
    const localTrack = local.tracks.find(
      (candidate) => candidate.track_key === track.track_key,
    );

    if (localTrack?.viewerVote == null) {
      return track;
    }

    return {
      ...track,
      viewerVote: localTrack.viewerVote,
      upCount: localTrack.upCount,
      downCount: localTrack.downCount,
    };
  }),
});

export const patchPlaylistTrackVoteInQueryCaches = (
  queryClient: QueryClient,
  playlistId: string,
  vote: PlaylistTrackVoteResponse,
  ownerUserId?: number | null,
): void => {
  queryClient.setQueryData<PublicPlaylistResponse>(
    PublicPlaylistQueryKeys.byId(playlistId),
    (previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        tracks: previous.tracks.map((track) =>
          track.track_key === vote.track_key
            ? patchTrackVoteFields(track, {
                upCount: vote.upCount,
                downCount: vote.downCount,
                viewerVote: vote.viewerVote,
              })
            : track,
        ),
      };
    },
  );

  if (ownerUserId == null) {
    return;
  }

  queryClient.setQueryData<PlaylistDetail>(
    PlaylistQueryKeys.byUserAndId(ownerUserId, playlistId),
    (previous) => {
      if (!previous) {
        return previous;
      }

      return {
        ...previous,
        tracks: previous.tracks.map((track) =>
          track.track_key === vote.track_key
            ? patchTrackVoteFields(track, {
                upCount: vote.upCount,
                downCount: vote.downCount,
              })
            : track,
        ),
      };
    },
  );
};
