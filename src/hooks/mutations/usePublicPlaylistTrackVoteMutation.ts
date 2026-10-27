import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import type { PlaylistTrackVoteDirection } from "src/constants/playlistTrackVote.constants";
import {
  PlaylistQueryKeys,
  PublicPlaylistQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { PlaylistTrackVoteBody } from "src/lib/validation/playlistTrackVote.schemas";
import {
  applyOptimisticPlaylistTrackVoteInQueryCaches,
  patchPlaylistTrackVoteInQueryCaches,
  rollbackOptimisticPlaylistTrackVoteInQueryCaches,
} from "src/utils/publicPlaylistTrackVoteQueryCache";

export type PublicPlaylistTrackVoteVariables = PlaylistTrackVoteBody & {
  playlistId: string;
  ownerUserId?: number | null;
  priorViewerVote?: PlaylistTrackVoteDirection | null;
};

export const usePublicPlaylistTrackVoteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      playlistId,
      ownerUserId: _ownerUserId,
      priorViewerVote: _priorViewerVote,
      ...body
    }: PublicPlaylistTrackVoteVariables) =>
      api.votePublicPlaylistTrack(playlistId, body),
    retry: false,
    onMutate: async (variables) => {
      const publicQueryKey = PublicPlaylistQueryKeys.byId(variables.playlistId);

      await queryClient.cancelQueries({ queryKey: publicQueryKey });

      if (variables.ownerUserId != null) {
        await queryClient.cancelQueries({
          queryKey: PlaylistQueryKeys.byUserAndId(
            variables.ownerUserId,
            variables.playlistId,
          ),
        });
      }

      return applyOptimisticPlaylistTrackVoteInQueryCaches(
        queryClient,
        variables.playlistId,
        variables.track_key,
        variables.vote,
        variables.ownerUserId,
        variables.priorViewerVote,
      );
    },
    onError: (_error, _variables, context) => {
      rollbackOptimisticPlaylistTrackVoteInQueryCaches(queryClient, context);
    },
    onSuccess: (response, variables) => {
      patchPlaylistTrackVoteInQueryCaches(
        queryClient,
        variables.playlistId,
        response,
        variables.ownerUserId,
      );
    },
  });
};
