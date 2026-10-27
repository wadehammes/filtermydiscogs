import { describe, expect, it } from "@jest/globals";
import { PAGE_DESCRIPTIONS, SITE_NAME } from "src/constants/siteMetadata";
import { buildPublicSharePageMetadata } from "src/lib/public-share-metadata.server";

describe("buildPublicSharePageMetadata", () => {
  it("when a public crate resolves, sets indexable robots and canonical URL", () => {
    const crateId = "ab65c378-fab9-42c0-96bb-c308d413cbbb";
    const metadata = buildPublicSharePageMetadata({
      kind: "crate",
      id: crateId,
      resolved: {
        name: "Weekend picks",
        username: "dj-crate",
        itemCount: 12,
      },
    });

    expect(metadata.title).toBe(`Weekend picks by dj-crate | ${SITE_NAME}`);
    expect(metadata.description).toContain('Public crate "Weekend picks"');
    expect(metadata.description).toContain("12 releases");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      `https://www.filtermydisco.gs/crate/${crateId}`,
    );
    expect(metadata.openGraph?.url).toBe(
      `https://www.filtermydisco.gs/crate/${crateId}`,
    );
  });

  it("when a public playlist has an owner description, uses it for meta description", () => {
    const playlistId = "11111111-2222-3333-4444-555555555555";
    const metadata = buildPublicSharePageMetadata({
      kind: "playlist",
      id: playlistId,
      resolved: {
        name: "Rotation",
        username: "dj-test",
        itemCount: 8,
        publicDescription: "Sunday morning deep house from my collection.",
      },
    });

    expect(metadata.description).toBe(
      "Sunday morning deep house from my collection.",
    );
    expect(metadata.openGraph?.description).toBe(
      "Sunday morning deep house from my collection.",
    );
  });

  it("when a public playlist resolves without username, omits byline in title", () => {
    const playlistId = "11111111-2222-3333-4444-555555555555";
    const metadata = buildPublicSharePageMetadata({
      kind: "playlist",
      id: playlistId,
      resolved: {
        name: "Rotation",
        username: null,
        itemCount: 1,
      },
    });

    expect(metadata.title).toBe(`Rotation | ${SITE_NAME}`);
    expect(metadata.description).toContain('Public playlist "Rotation"');
    expect(metadata.description).toContain("1 track");
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.alternates?.canonical).toBe(
      `https://www.filtermydisco.gs/playlist/${playlistId}`,
    );
  });

  it("when the share does not resolve, uses noindex robots and fallback copy", () => {
    const metadata = buildPublicSharePageMetadata({
      kind: "playlist",
      id: "11111111-2222-3333-4444-555555555555",
      resolved: null,
    });

    expect(metadata.title).toBe(`Playlist | ${SITE_NAME}`);
    expect(metadata.description).toBe(PAGE_DESCRIPTIONS.playlistFallback);
    expect(metadata.robots).toEqual({ index: false, follow: false });
    expect(metadata.alternates?.canonical).toBeUndefined();
  });
});
