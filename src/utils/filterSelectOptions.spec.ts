import { describe, expect, it } from "@jest/globals";
import { withSelectedFilterSelectOptions } from "src/utils/filterSelectOptions";

describe("withSelectedFilterSelectOptions", () => {
  it("includes selected values that are missing from the available facet list", () => {
    expect(
      withSelectedFilterSelectOptions(["House"], ["Techno", "House"]),
    ).toEqual([
      { value: "House", label: "House" },
      { value: "Techno", label: "Techno" },
    ]);
  });

  it("returns available options when nothing is selected", () => {
    expect(withSelectedFilterSelectOptions(["Ambient"], [])).toEqual([
      { value: "Ambient", label: "Ambient" },
    ]);
  });
});
