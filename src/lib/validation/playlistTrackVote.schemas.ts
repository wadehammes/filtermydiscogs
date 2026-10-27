import {
  PLAYLIST_TRACK_VOTE_DOWN,
  PLAYLIST_TRACK_VOTE_UP,
} from "src/constants/playlistTrackVote.constants";
import { z } from "zod";

export const playlistTrackVoteBodySchema = z.object({
  track_key: z.string().trim().min(1),
  vote: z.union([
    z.literal(PLAYLIST_TRACK_VOTE_UP),
    z.literal(PLAYLIST_TRACK_VOTE_DOWN),
  ]),
});

export type PlaylistTrackVoteBody = z.infer<typeof playlistTrackVoteBodySchema>;
