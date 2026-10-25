import { beforeEach, describe, expect, it, jest } from "@jest/globals";
import { playlistTrackRowFactory } from "src/tests/factories/PlaylistTrackRow.factory";

jest.mock("src/lib/db", () => ({
  prisma: {
    userTrack: { update: jest.fn() },
    $transaction: jest.fn((operations: Promise<unknown>[]) =>
      Promise.all(operations),
    ),
  },
}));

jest.mock("src/lib/discogs-consumer-search.server", () => ({
  searchDiscogsDatabase: jest.fn(),
}));

jest.mock("src/lib/backfill-user-track-discogs-release-id.server", () => ({
  backfillDiscogsReleaseIdsForPlaylistTracks: jest.fn(
    async ({
      tracks,
    }: {
      tracks: import("src/types/playlist.types").PlaylistTrackRow[];
    }) => tracks,
  ),
}));

type SearchModule = typeof import("src/lib/discogs-consumer-search.server");

let backfillDiscogsReleaseIdsFromDiscogsSearch: typeof import("src/lib/backfill-user-track-discogs-release-id-search.server")["backfillDiscogsReleaseIdsFromDiscogsSearch"];
let mockSearchDiscogsDatabase: jest.MockedFunction<
  SearchModule["searchDiscogsDatabase"]
>;

describe("backfillDiscogsReleaseIdsFromDiscogsSearch", () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    const [backfillModule, searchModule] = await Promise.all([
      import("src/lib/backfill-user-track-discogs-release-id-search.server"),
      import("src/lib/discogs-consumer-search.server"),
    ]);
    backfillDiscogsReleaseIdsFromDiscogsSearch =
      backfillModule.backfillDiscogsReleaseIdsFromDiscogsSearch;
    mockSearchDiscogsDatabase = jest.mocked(searchModule.searchDiscogsDatabase);
    mockSearchDiscogsDatabase.mockResolvedValue(null);
  });

  it("stores discogs_release_id from a Discogs search when metadata has artist and release title", async () => {
    const track = playlistTrackRowFactory.opening({
      discogs_release_id: null,
      artist: "Janeret",
      release_title: "Gaia EP",
    });

    mockSearchDiscogsDatabase.mockResolvedValue({
      pagination: { pages: 1, items: 1, urls: { next: "", prev: "" } },
      results: [
        {
          id: 987654,
          type: "release",
          title: "Gaia EP",
          uri: "",
          resource_url: "",
          thumb: "",
          cover_image: "",
        },
      ],
    });

    const patched = await backfillDiscogsReleaseIdsFromDiscogsSearch({
      userId: 7,
      tracks: [track],
    });

    expect(mockSearchDiscogsDatabase).toHaveBeenCalledWith({
      q: "Janeret Gaia EP",
      type: "release",
      per_page: "5",
    });
    expect(patched[0]?.discogs_release_id).toBe(987654);
  });
});
