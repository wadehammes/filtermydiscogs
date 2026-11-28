import { describe, expect, it } from "@jest/globals";
import {
  extractExcludedStyleLabelsFromPrompt,
  extractExplicitYearsFromPrompt,
  extractIncludeStyleLabelsFromPrompt,
} from "src/utils/collectionCommandPromptRules";

describe("collectionCommandPromptRules", () => {
  it("when prompt says from 2018, extractExplicitYearsFromPrompt returns 2018", () => {
    expect(
      extractExplicitYearsFromPrompt(
        "Show me all Deep House releases from 2018 that arent House",
      ),
    ).toEqual([2018]);
  });

  it("when prompt says in 1999, extractExplicitYearsFromPrompt returns 1999", () => {
    expect(extractExplicitYearsFromPrompt("Techno in 1999 on vinyl")).toEqual([
      1999,
    ]);
  });

  it("when prompt uses last N years, extractExplicitYearsFromPrompt returns empty", () => {
    expect(
      extractExplicitYearsFromPrompt("Electro from the last 3 years"),
    ).toEqual([]);
  });

  it("when prompt lists between years, extractExplicitYearsFromPrompt returns inclusive span", () => {
    expect(
      extractExplicitYearsFromPrompt("Jazz between 2010 and 2012"),
    ).toEqual([2010, 2011, 2012]);
  });

  it("when prompt ends with arent House, extractExcludedStyleLabelsFromPrompt returns House", () => {
    expect(
      extractExcludedStyleLabelsFromPrompt(
        "Deep House from 2018 that arent House",
      ),
    ).toEqual(["House"]);
  });

  it("when prompt uses excluding, extractExcludedStyleLabelsFromPrompt returns labels", () => {
    expect(
      extractExcludedStyleLabelsFromPrompt(
        "Techno excluding Ambient and Noise",
      ),
    ).toEqual(["Ambient", "Noise"]);
  });

  it("when prompt has no exclusion, extractExcludedStyleLabelsFromPrompt returns empty", () => {
    expect(
      extractExcludedStyleLabelsFromPrompt("Deep House from 2018"),
    ).toEqual([]);
  });

  it("when prompt names a style before releases, extractIncludeStyleLabelsFromPrompt returns that style", () => {
    expect(
      extractIncludeStyleLabelsFromPrompt(
        "Show me all Deep House releases from 2018",
      ),
    ).toEqual(["Deep House"]);
  });

  it("when prompt requests two styles with AND, extractIncludeStyleLabelsFromPrompt returns both", () => {
    expect(
      extractIncludeStyleLabelsFromPrompt(
        "Electro and Deep House releases from the 90s",
      ),
    ).toEqual(["Electro", "Deep House"]);
  });

  it("when prompt names a style before a from-year phrase without releases, extractIncludeStyleLabelsFromPrompt returns that style", () => {
    expect(extractIncludeStyleLabelsFromPrompt("Deep House from 2018")).toEqual(
      ["Deep House"],
    );
    expect(
      extractIncludeStyleLabelsFromPrompt("Vinyl only: Deep House from 2018"),
    ).toEqual(["Deep House"]);
  });
});
