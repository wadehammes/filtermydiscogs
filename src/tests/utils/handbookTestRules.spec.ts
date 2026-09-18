import { describe, expect, it } from "@jest/globals";
import {
  collectHandbookTestViolations,
  formatHandbookTestViolations,
  isFeatureTestFile,
  isHandbookTestRulesAllowlisted,
  validateFeatureTestSource,
} from "src/tests/utils/handbookTestRules";

describe("handbookTestRules", () => {
  it("identifies feature test files and handbook rules spec allowlist paths", () => {
    expect(
      isFeatureTestFile("src/context/releasePlayback.context.spec.tsx"),
    ).toBe(true);
    expect(
      isFeatureTestFile("src/components/ReleaseModal/ReleaseModal.po.tsx"),
    ).toBe(true);
    expect(isFeatureTestFile("src/tests/utils/handbookTestRules.ts")).toBe(
      false,
    );

    expect(
      isHandbookTestRulesAllowlisted(
        "src/tests/utils/handbookTestRules.spec.ts",
      ),
    ).toBe(true);
    expect(
      isHandbookTestRulesAllowlisted(
        "src/context/releasePlayback.context.spec.tsx",
      ),
    ).toBe(false);
  });

  it("flags specs under src/hooks/mutations or src/hooks/queries", () => {
    const violations = validateFeatureTestSource(
      "src/hooks/mutations/useCollectionMutations.hook.spec.ts",
      `describe("useSaveReleaseRatingMutation", () => {});\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "forbidden-hook-layer-spec",
        line: 1,
      }),
    ]);
  });

  it("flags jest.mock on src/hooks/mutations in feature tests", () => {
    const violations = validateFeatureTestSource(
      "src/components/ReleaseSummaryHero/ReleaseSummaryHero.spec.tsx",
      `jest.mock("src/hooks/mutations/useCollectionMutations");\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "jest-mock-mutation-hook",
        line: 1,
      }),
    ]);
  });

  it("flags jest.mock on src/hooks/queries in feature tests", () => {
    const violations = validateFeatureTestSource(
      "src/context/releasePlayback.context.spec.tsx",
      `jest.mock("src/hooks/queries/useDiscogsReleaseQuery");\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "jest-mock-query-hook",
        line: 1,
      }),
    ]);
  });

  it("flags jest.mocked query hooks imported from src/hooks/queries", () => {
    const violations = validateFeatureTestSource(
      "src/context/releasePlayback.context.spec.tsx",
      `import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";\njest.mocked(useDiscogsReleaseQuery).mockImplementation(...);\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "jest-mocked-query-hook",
        line: 2,
      }),
    ]);
  });

  it("keeps feature tests free of handbook testing violations", () => {
    const violations = collectHandbookTestViolations(process.cwd());

    expect(violations).toEqual([]);
  });

  it("formats violations for hook and CI output", () => {
    const formatted = formatHandbookTestViolations([
      {
        filePath: "src/context/releasePlayback.context.spec.tsx",
        line: 12,
        rule: "jest-mock-query-hook",
        message: "Do not jest.mock query hooks.",
        excerpt: 'jest.mock("src/hooks/queries/useDiscogsReleaseQuery");',
      },
    ]);

    expect(formatted).toContain("[jest-mock-query-hook]");
    expect(formatted).toContain("releasePlayback.context.spec.tsx:12");
  });
});
