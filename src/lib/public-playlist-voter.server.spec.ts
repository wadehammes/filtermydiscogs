import { describe, expect, it } from "@jest/globals";
import {
  buildPlaylistTrackVoterKey,
  buildPlaylistTrackVoterLookupKeys,
} from "src/lib/public-playlist-voter.server";

describe("public-playlist-voter.server", () => {
  it("builds lookup keys for signed-in visitors with a prior anonymous cookie", () => {
    expect(buildPlaylistTrackVoterLookupKeys(42, "anon-cookie")).toEqual([
      "user:42",
      "anon:anon-cookie",
    ]);
  });

  it("prefers a user voter key when both identities are present", () => {
    expect(buildPlaylistTrackVoterKey(42, "anon-cookie")).toBe("user:42");
  });

  it("falls back to anonymous keys for unsigned visitors", () => {
    expect(buildPlaylistTrackVoterLookupKeys(null, "anon-cookie")).toEqual([
      "anon:anon-cookie",
    ]);
  });
});
