import { describe, expect, it } from "@jest/globals";
import { definedProps } from "src/utils/definedProps";

describe("definedProps", () => {
  it("omits undefined values", () => {
    expect(definedProps({ a: 1, b: undefined, c: "x" })).toEqual({
      a: 1,
      c: "x",
    });
  });

  it("returns an empty object when all values are undefined", () => {
    expect(definedProps({ a: undefined, b: undefined })).toEqual({});
  });

  it("preserves false and zero", () => {
    expect(definedProps({ a: false, b: 0 })).toEqual({ a: false, b: 0 });
  });
});
