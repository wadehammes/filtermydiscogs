import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  DiscogsExternalLink,
  DiscogsReleaseExternalLink,
  getDiscogsReleaseUrl,
} from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import { DiscogsExternalLinkPageObject } from "src/components/DiscogsExternalLink/DiscogsExternalLink.po";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { render, screen } from "test-utils";

let po: DiscogsExternalLinkPageObject;

describe("DiscogsExternalLink", () => {
  beforeEach(() => {
    po = new DiscogsExternalLinkPageObject();
  });

  it("renders text variant", () => {
    po.renderDiscogsExternalLink();

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/1");
  });

  it("renders icon variant", () => {
    render(
      <DiscogsExternalLink
        href="https://www.discogs.com/release/42"
        variant="icon"
      />,
    );

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/42");
  });

  it("renders toolbar variant", () => {
    render(
      <DiscogsExternalLink
        href="https://www.discogs.com/release/42"
        variant="toolbar"
      />,
    );

    expect(
      screen.getByRole("link", { name: "View on Discogs" }),
    ).toHaveAttribute("href", "https://www.discogs.com/release/42");
  });
});

describe("DiscogsReleaseExternalLink", () => {
  it("returns null when the release has no Discogs URL", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        resource_url: "",
      },
    });

    const { container } = render(
      <DiscogsReleaseExternalLink release={release} variant="text" />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("builds release URLs from resource_url", () => {
    const release = releaseFactory.build({
      basic_information: {
        ...releaseFactory.build().basic_information,
        resource_url: "https://api.discogs.com/releases/12345",
      },
    });

    expect(getDiscogsReleaseUrl(release)).toBe(
      "https://www.discogs.com/release/12345",
    );
  });
});
