import { describe, expect, it } from "@jest/globals";
import { renderToStaticMarkup } from "react-dom/server";
import { PublicShareOgImage } from "src/lib/og/publicShareOgImage";

describe("PublicShareOgImage", () => {
  it("when cover urls are provided, renders a four-cell collage and title copy", () => {
    const markup = renderToStaticMarkup(
      <PublicShareOgImage
        title="Weekend crate"
        line2="by collector · FilterMyDiscogs"
        coverThumbUrls={[
          "https://i.discogs.com/1.jpg",
          "https://i.discogs.com/2.jpg",
        ]}
      />,
    );

    expect(markup).toContain("Weekend crate");
    expect(markup).toContain("by collector · FilterMyDiscogs");
    expect(markup.match(/<img/g)?.length).toBe(2);
  });

  it("when cover urls are missing, renders the text-only fallback card", () => {
    const markup = renderToStaticMarkup(
      <PublicShareOgImage
        title="Empty crate"
        line2="FilterMyDiscogs"
        coverThumbUrls={[]}
      />,
    );

    expect(markup).toContain("Empty crate");
    expect(markup).not.toContain("<img");
  });
});
