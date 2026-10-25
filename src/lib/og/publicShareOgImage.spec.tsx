import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import {
  buildPublicShareOgCountLabel,
  buildPublicShareOgUpdatedLabel,
  PublicShareOgImage,
} from "src/lib/og/publicShareOgImage";
import { formatDate } from "src/utils/dateHelpers";

const UPDATED_AT = "2026-10-25T18:00:00.000Z";

describe("PublicShareOgImage", () => {
  it("formats a track or release count", () => {
    expect(buildPublicShareOgCountLabel(1, "track")).toBe("1 track");
    expect(buildPublicShareOgCountLabel(12, "track")).toBe("12 tracks");
    expect(buildPublicShareOgCountLabel(1, "release")).toBe("1 release");
    expect(buildPublicShareOgCountLabel(4, "release")).toBe("4 releases");
    expect(buildPublicShareOgCountLabel(null, "track")).toBeNull();
  });

  it("formats the updated date and skips a missing timestamp", () => {
    expect(buildPublicShareOgUpdatedLabel(UPDATED_AT)).toBe(
      `Updated ${formatDate(UPDATED_AT)}`,
    );
    expect(buildPublicShareOgUpdatedLabel(null)).toBeNull();
    expect(buildPublicShareOgUpdatedLabel("not-a-date")).toBeNull();
  });

  it("when cover urls are provided, renders a four-cell collage and title copy", () => {
    const markup = renderToStaticMarkup(
      <PublicShareOgImage
        coverThumbUrls={[
          "https://i.discogs.com/1.jpg",
          "https://i.discogs.com/2.jpg",
        ]}
        itemCount={12}
        itemNoun="track"
        kind="playlist"
        title="Weekend crate"
        updatedAt={UPDATED_AT}
        username="collector"
      />,
    );

    expect(markup).toContain("Weekend crate");
    expect(markup).toContain("Playlist");
    expect(markup).toContain("by collector");
    expect(markup).toContain("FilterMyDisco.gs");
    expect(markup.match(/<img/g)?.length).toBe(2);
  });

  it("when cover urls are provided, collage cells use flex layout", () => {
    const markup = renderToStaticMarkup(
      <PublicShareOgImage
        coverThumbUrls={[
          "https://i.discogs.com/1.jpg",
          "https://i.discogs.com/2.jpg",
        ]}
        itemCount={12}
        itemNoun="track"
        kind="playlist"
        title="Weekend crate"
        updatedAt={UPDATED_AT}
        username="collector"
      />,
    );
    const cells = markup.match(/<div style="[^"]*"><img/g) ?? [];

    expect(cells).toHaveLength(2);
    expect(cells.every((cell) => cell.includes("display:flex"))).toBe(true);
  });

  it("when cover urls are provided, the text panel shows count and updated date", () => {
    const markup = renderToStaticMarkup(
      <PublicShareOgImage
        coverThumbUrls={["https://i.discogs.com/1.jpg"]}
        itemCount={12}
        itemNoun="track"
        kind="playlist"
        title="Weekend crate"
        updatedAt={UPDATED_AT}
        username="collector"
      />,
    );

    expect(markup).toContain("Playlist");
    expect(markup).toContain("background:#000");
    expect(markup).toContain("font-family:DM Sans");
    expect(markup).toContain("12 tracks");
    expect(markup).toContain(`Updated ${formatDate(UPDATED_AT)}`);
    expect(markup).toContain("by collector");
  });

  it("when cover urls are missing, renders the text-only fallback card", () => {
    const markup = renderToStaticMarkup(
      <PublicShareOgImage
        coverThumbUrls={[]}
        itemCount={1}
        itemNoun="release"
        kind="crate"
        title="Empty crate"
        updatedAt={UPDATED_AT}
        username={null}
      />,
    );

    expect(markup).toContain("Empty crate");
    expect(markup).toContain("Crate");
    expect(markup).toContain("FilterMyDisco.gs");
    expect(markup).toContain("1 release");
    expect(markup).toContain(`Updated ${formatDate(UPDATED_AT)}`);
    expect(markup).not.toContain("by ");
    expect(markup).toContain("background:#000");
    expect(markup).toContain("font-family:DM Sans");
    expect(markup).not.toContain("<img");
    expect(markup).not.toContain("linear-gradient");
  });
});
