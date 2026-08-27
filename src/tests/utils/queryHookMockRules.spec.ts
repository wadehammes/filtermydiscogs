import { describe, expect, it } from "@jest/globals";
import {
  collectQueryHookMockViolations,
  formatQueryHookMockViolations,
  isFeatureTestFile,
  isQueryHookMockAllowlisted,
  validateFeatureTestSource,
} from "src/tests/utils/queryHookMockRules";

describe("queryHookMockRules", () => {
  it("identifies feature test files and query-hook spec allowlist paths", () => {
    expect(
      isFeatureTestFile("src/context/releasePlayback.context.spec.tsx"),
    ).toBe(true);
    expect(
      isFeatureTestFile("src/components/ReleaseModal/ReleaseModal.po.tsx"),
    ).toBe(true);
    expect(
      isFeatureTestFile("src/hooks/queries/useDiscogsCollectionQuery.spec.tsx"),
    ).toBe(true);
    expect(isFeatureTestFile("src/tests/utils/queryHookMockRules.ts")).toBe(
      false,
    );

    expect(
      isQueryHookMockAllowlisted(
        "src/hooks/queries/useDiscogsCollectionQuery.spec.tsx",
      ),
    ).toBe(true);
    expect(
      isQueryHookMockAllowlisted(
        "src/context/releasePlayback.context.spec.tsx",
      ),
    ).toBe(false);
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

  it("allows query-hook unit tests under src/hooks/queries", () => {
    const violations = validateFeatureTestSource(
      "src/hooks/queries/useDiscogsCollectionQuery.spec.tsx",
      `jest.mock("src/hooks/queries/useDiscogsCollectionQuery");\n`,
    );

    expect(violations).toEqual([]);
  });

  it("keeps feature tests free of query-hook mocks", () => {
    const violations = collectQueryHookMockViolations(process.cwd());

    expect(violations).toEqual([]);
  });

  it("formats violations for hook and CI output", () => {
    const formatted = formatQueryHookMockViolations([
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
