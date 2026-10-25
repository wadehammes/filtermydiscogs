import { describe, expect, it } from "@jest/globals";
import { LOGIN_DEMO_PUBLIC_CRATE_ID } from "src/constants/publicCrate.constants";
import {
  LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
  LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
} from "src/constants/publicPlaylist.constants";

describe("getE2eDemoPublicShareMetadataResolved", () => {
  it("when E2E mock embed is disabled, returns null for demo ids", async () => {
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
    const { getE2eDemoPublicShareMetadataResolved } = await import(
      "src/lib/public-share-e2e.server"
    );

    expect(
      getE2eDemoPublicShareMetadataResolved(
        "crate",
        LOGIN_DEMO_PUBLIC_CRATE_ID,
      ),
    ).toBeNull();
  });

  it("when E2E mock embed is enabled, returns demo crate metadata", async () => {
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";
    const { getE2eDemoPublicShareMetadataResolved } = await import(
      "src/lib/public-share-e2e.server"
    );

    expect(
      getE2eDemoPublicShareMetadataResolved(
        "crate",
        LOGIN_DEMO_PUBLIC_CRATE_ID,
      ),
    ).toEqual({
      name: "E2E Public Demo Crate",
      username: "testuser",
      itemCount: 4,
    });

    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
  });

  it("when E2E mock embed is enabled, returns demo playlist metadata", async () => {
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";
    const { getE2eDemoPublicShareMetadataResolved } = await import(
      "src/lib/public-share-e2e.server"
    );

    expect(
      getE2eDemoPublicShareMetadataResolved(
        "playlist",
        LOGIN_DEMO_PUBLIC_PLAYLIST_ID,
      ),
    ).toEqual({
      name: LOGIN_DEMO_PUBLIC_PLAYLIST_TITLE,
      username: "testuser",
      itemCount: 2,
    });

    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
  });
});

describe("shouldNotFoundPublicSharePage", () => {
  it("when E2E bypass applies to the demo crate, does not notFound without server payload", async () => {
    process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED = "1";
    const { shouldNotFoundPublicSharePage } = await import(
      "src/lib/public-share-e2e.server"
    );

    expect(
      shouldNotFoundPublicSharePage({
        kind: "crate",
        id: LOGIN_DEMO_PUBLIC_CRATE_ID,
        hasServerPayload: false,
      }),
    ).toBe(false);

    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
  });

  it("when server payload is missing and bypass does not apply, notFound", async () => {
    delete process.env.NEXT_PUBLIC_E2E_MOCK_YOUTUBE_EMBED;
    const { shouldNotFoundPublicSharePage } = await import(
      "src/lib/public-share-e2e.server"
    );

    expect(
      shouldNotFoundPublicSharePage({
        kind: "crate",
        id: LOGIN_DEMO_PUBLIC_CRATE_ID,
        hasServerPayload: false,
      }),
    ).toBe(true);
  });
});
