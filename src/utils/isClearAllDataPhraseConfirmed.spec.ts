import { describe, expect, it } from "@jest/globals";
import { CLEAR_ALL_DATA_CONFIRM_PHRASE } from "src/constants/clearData.constants";
import { isClearAllDataPhraseConfirmed } from "src/utils/isClearAllDataPhraseConfirmed";

describe("isClearAllDataPhraseConfirmed", () => {
  it("returns false when input is empty", () => {
    expect(isClearAllDataPhraseConfirmed("")).toBe(false);
  });

  it("returns false when input does not match the confirm phrase", () => {
    expect(isClearAllDataPhraseConfirmed("delete my account")).toBe(false);
    expect(isClearAllDataPhraseConfirmed("DELETE MY DATA")).toBe(false);
  });

  it("returns true when input matches the confirm phrase exactly", () => {
    expect(isClearAllDataPhraseConfirmed(CLEAR_ALL_DATA_CONFIRM_PHRASE)).toBe(
      true,
    );
  });

  it("trims surrounding whitespace before comparing", () => {
    expect(
      isClearAllDataPhraseConfirmed(`  ${CLEAR_ALL_DATA_CONFIRM_PHRASE}  `),
    ).toBe(true);
  });
});
