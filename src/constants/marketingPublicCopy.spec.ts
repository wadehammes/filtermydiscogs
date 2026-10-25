import { describe, expect, it } from "@jest/globals";
import {
  MARKETING_CRATE_ORGANIZE_BULLET,
  MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE,
  PUBLIC_CRATE_MARKETING_BULLETS,
  PUBLIC_PLAYLIST_MARKETING_BULLETS,
} from "src/constants/marketingPublicCopy";

describe("marketingPublicCopy", () => {
  it("uses crate demo language on public crate pages only", () => {
    expect(MARKETING_CRATE_ORGANIZE_BULLET.text).toMatch(/like this one/i);
    expect(PUBLIC_CRATE_MARKETING_BULLETS).toContain(
      MARKETING_CRATE_ORGANIZE_BULLET,
    );
  });

  it("uses playlist demo language on public playlist pages only", () => {
    expect(MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE.text).toMatch(
      /public playlist link like this one/i,
    );
    expect(PUBLIC_PLAYLIST_MARKETING_BULLETS).toContain(
      MARKETING_PLAYLIST_BULLET_PUBLIC_PAGE,
    );
    expect(
      PUBLIC_PLAYLIST_MARKETING_BULLETS.some((bullet) =>
        bullet.text.match(/public crate link like this one/i),
      ),
    ).toBe(false);
  });
});
