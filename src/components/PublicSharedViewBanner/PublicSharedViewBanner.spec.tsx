import { beforeEach, describe, expect, it } from "@jest/globals";
import { PublicSharedViewBannerPageObject } from "src/components/PublicSharedViewBanner/PublicSharedViewBanner.po";
import { screen } from "test-utils";

let po: PublicSharedViewBannerPageObject;

describe("PublicSharedViewBanner", () => {
  beforeEach(() => {
    po = new PublicSharedViewBannerPageObject();
  });

  it("renders a compact shared-by line for public playlists", () => {
    po.renderPublicSharedViewBanner({
      kind: "playlist",
      username: "wadehammes",
    });

    expect(screen.getByTestId(po.testId)).toHaveTextContent(
      "Public playlist · Shared by wadehammes",
    );
  });

  it("renders a compact shared-by line for public crates", () => {
    po.renderPublicSharedViewBanner({
      kind: "crate",
      username: "wadehammes",
    });

    expect(screen.getByTestId(po.testId)).toHaveTextContent(
      "Public crate · Shared by wadehammes",
    );
  });

  it("renders the kind label when username is missing", () => {
    po.renderPublicSharedViewBanner({
      kind: "crate",
      username: null,
    });

    expect(screen.getByTestId(po.testId)).toHaveTextContent("Public crate");
    expect(screen.getByTestId(po.testId)).not.toHaveTextContent("Shared by");
  });
});
