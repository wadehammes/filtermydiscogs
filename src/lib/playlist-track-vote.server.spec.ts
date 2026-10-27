import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import type { Prisma } from "@prisma/client";
import { PLAYLIST_TRACK_VOTE_UP } from "src/constants/playlistTrackVote.constants";
import {
  type PlaylistTrackVoteCountsRow,
  playlistTrackVoteCountsRowFactory,
} from "src/tests/factories/PlaylistTrackPrisma.factory";
import { publicPlaylistRowFactory } from "src/tests/factories/PublicPlaylistRow.factory";
import {
  mockPrismaDelegate,
  mockPrismaInteractiveTransaction,
} from "src/tests/helpers/mockPrismaDelegate";

jest.mock("src/lib/public-playlist-query.server", () => ({
  findPublicPlaylistById: jest.fn(),
}));

jest.mock("src/lib/db", () => ({
  prisma: {
    playlistTrack: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    playlistTrackVote: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

type QueryModule = typeof import("src/lib/public-playlist-query.server");

let mockFindPublicPlaylistById: jest.MockedFunction<
  QueryModule["findPublicPlaylistById"]
>;
let recordPublicPlaylistTrackVote: typeof import("src/lib/playlist-track-vote.server")["recordPublicPlaylistTrackVote"];
let mockPlaylistTrackFindUnique: jest.Mock<
  (...args: unknown[]) => Promise<PlaylistTrackVoteCountsRow | null>
>;
let mockPlaylistTrackVoteFindUnique: jest.Mock<
  (...args: unknown[]) => Promise<{ vote: number } | null>
>;
let mockTransaction: ReturnType<typeof mockPrismaInteractiveTransaction>;

const createVoteTransactionClient = (
  updatedCounts: PlaylistTrackVoteCountsRow,
) => ({
  playlistTrackVote: {
    upsert: jest.fn(async () => ({})),
    delete: jest.fn(async () => ({})),
  },
  playlistTrack: {
    update: jest.fn(async () => updatedCounts),
  },
});

beforeEach(async () => {
  jest.clearAllMocks();
  const voteModule = await import("src/lib/playlist-track-vote.server");
  recordPublicPlaylistTrackVote = voteModule.recordPublicPlaylistTrackVote;
  const query = await import("src/lib/public-playlist-query.server");
  mockFindPublicPlaylistById = jest.mocked(query.findPublicPlaylistById);
  const { prisma } = await import("src/lib/db");
  mockPlaylistTrackFindUnique =
    mockPrismaDelegate<PlaylistTrackVoteCountsRow | null>(
      jest.mocked(prisma.playlistTrack.findUnique),
    );
  mockPlaylistTrackVoteFindUnique = mockPrismaDelegate<{ vote: number } | null>(
    jest.mocked(prisma.playlistTrackVote.findUnique),
  );
  mockTransaction = mockPrismaInteractiveTransaction(
    jest.mocked(prisma.$transaction),
  );
});

describe("playlist-track-vote.server", () => {
  it("returns current counts without persisting when the playlist owner votes", async () => {
    const playlist = publicPlaylistRowFactory.build({ user_id: 100 });
    const voteCounts = playlistTrackVoteCountsRowFactory.build({
      up_count: 2,
      down_count: 1,
    });
    mockFindPublicPlaylistById.mockResolvedValue(playlist);
    mockPlaylistTrackFindUnique.mockResolvedValue(voteCounts);

    const result = await recordPublicPlaylistTrackVote({
      playlistId: playlist.id,
      trackKey: "1:A1",
      requestedVote: PLAYLIST_TRACK_VOTE_UP,
      voterKey: "user:100",
      viewerUserId: 100,
    });

    expect(result).toEqual({
      track_key: "1:A1",
      upCount: 2,
      downCount: 1,
      viewerVote: null,
    });
    expect(mockPlaylistTrackVoteFindUnique).not.toHaveBeenCalled();
    expect(mockTransaction).not.toHaveBeenCalled();
  });

  it("creates an up vote and increments up_count for visitors", async () => {
    const playlist = publicPlaylistRowFactory.build({ user_id: 100 });
    const voteCounts = playlistTrackVoteCountsRowFactory.build({
      up_count: 0,
      down_count: 0,
    });
    const updatedCounts = playlistTrackVoteCountsRowFactory.build({
      up_count: 1,
      down_count: 0,
    });
    mockFindPublicPlaylistById.mockResolvedValue(playlist);
    mockPlaylistTrackFindUnique.mockResolvedValue(voteCounts);
    mockPlaylistTrackVoteFindUnique.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (callback) => {
      if (typeof callback !== "function") {
        throw new Error("Expected interactive transaction callback");
      }

      const tx = createVoteTransactionClient(updatedCounts);

      return callback(tx as unknown as Prisma.TransactionClient);
    });

    const result = await recordPublicPlaylistTrackVote({
      playlistId: playlist.id,
      trackKey: "1:A1",
      requestedVote: PLAYLIST_TRACK_VOTE_UP,
      voterKey: "anon:abc",
    });

    expect(result).toEqual({
      track_key: "1:A1",
      upCount: 1,
      downCount: 0,
      viewerVote: PLAYLIST_TRACK_VOTE_UP,
    });
    expect(mockTransaction).toHaveBeenCalled();
  });
});
