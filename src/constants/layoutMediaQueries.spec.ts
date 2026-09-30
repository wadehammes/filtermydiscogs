import {
  BELOW_DESKTOP_LAYOUT_MEDIA_QUERY,
  COMPACT_LAYOUT_MEDIA_QUERY,
  DESKTOP_LAYOUT_MEDIA_QUERY,
  layoutMatchesMediaQueryAtWidth,
  TABLET_UP_MEDIA_QUERY,
} from "src/constants/layoutMediaQueries";

describe("layoutMediaQueries", () => {
  it("classifies structural desktop at 1024px and up", () => {
    expect(
      layoutMatchesMediaQueryAtWidth(DESKTOP_LAYOUT_MEDIA_QUERY, 1023),
    ).toBe(false);
    expect(
      layoutMatchesMediaQueryAtWidth(DESKTOP_LAYOUT_MEDIA_QUERY, 1024),
    ).toBe(true);
  });

  it("leaves tablet band below desktop but above compact", () => {
    expect(
      layoutMatchesMediaQueryAtWidth(BELOW_DESKTOP_LAYOUT_MEDIA_QUERY, 900),
    ).toBe(true);
    expect(
      layoutMatchesMediaQueryAtWidth(COMPACT_LAYOUT_MEDIA_QUERY, 900),
    ).toBe(false);
    expect(
      layoutMatchesMediaQueryAtWidth(COMPACT_LAYOUT_MEDIA_QUERY, 768),
    ).toBe(true);
    expect(
      layoutMatchesMediaQueryAtWidth(COMPACT_LAYOUT_MEDIA_QUERY, 769),
    ).toBe(false);
  });

  it("treats tablet-up nav at 768px", () => {
    expect(layoutMatchesMediaQueryAtWidth(TABLET_UP_MEDIA_QUERY, 767)).toBe(
      false,
    );
    expect(layoutMatchesMediaQueryAtWidth(TABLET_UP_MEDIA_QUERY, 768)).toBe(
      true,
    );
  });
});
