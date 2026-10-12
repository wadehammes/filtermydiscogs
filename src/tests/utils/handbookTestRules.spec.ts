import { describe, expect, it } from "@jest/globals";
import {
  collectHandbookTestViolations,
  formatHandbookTestViolations,
  isComponentSpecFile,
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

  it("identifies component spec files excluding hook specs", () => {
    expect(
      isComponentSpecFile(
        "src/components/ReleaseSummaryHero/ReleaseSummaryHero.spec.tsx",
      ),
    ).toBe(true);
    expect(
      isComponentSpecFile("src/hooks/useCollectionData.hook.spec.ts"),
    ).toBe(false);
    expect(
      isComponentSpecFile(
        "src/components/FiltersDrawer/useFiltersDrawer.hook.spec.tsx",
      ),
    ).toBe(false);
  });

  it("flags mockApiResponse imports in component specs", () => {
    const violations = validateFeatureTestSource(
      "src/components/Example/Example.spec.tsx",
      `import { mockApiResponse } from "src/tests/mocks/mockApiResponse";\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "component-spec-mock-api-response-import",
        line: 1,
      }),
    ]);
  });

  it("flags setupFetchDiscogsReleaseMock imports in component specs", () => {
    const violations = validateFeatureTestSource(
      "src/components/Example/Example.spec.tsx",
      `import { setupFetchDiscogsReleaseMock } from "src/tests/mocks/setupFetchDiscogsReleaseMock";\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "component-spec-setup-fetch-discogs-release-mock-import",
        line: 1,
      }),
    ]);
  });

  it("flags inline DiscogsVideo embed literals in feature tests", () => {
    const violations = validateFeatureTestSource(
      "src/context/releasePlayback.context.spec.tsx",
      `const videos = [{ embed: true, uri: "https://youtube.com/watch?v=abc", title: "X" }];\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "inline-discogs-video-embed",
        line: 1,
      }),
    ]);
  });

  it("flags inline DiscogsTrack type literals outside discogsTrackFactory.build", () => {
    const violations = validateFeatureTestSource(
      "src/hooks/example.hook.spec.ts",
      `const track = { position: "A1", title: "X", type_: "track" };\n`,
    );

    expect(violations).toEqual([
      expect.objectContaining({
        rule: "inline-discogs-track-type",
        line: 1,
      }),
    ]);
  });

  it("allows type_: track inside discogsTrackFactory.build", () => {
    expect(
      validateFeatureTestSource(
        "src/utils/releasePlayback.spec.ts",
        `const track = discogsTrackFactory.build({\n  position: "A",\n  type_: "track",\n});\n`,
      ),
    ).toEqual([]);
  });

  it("allows youtube uri overrides inside discogsVideoFactory.build", () => {
    expect(
      validateFeatureTestSource(
        "src/utils/releasePlaybackPendingResolution.spec.ts",
        `const video = discogsVideoFactory.build({\n  uri: "https://youtube.com/watch?v=abc",\n});\n`,
      ),
    ).toEqual([]);
  });

  it("allows mockApiResponse imports in page objects and hook specs", () => {
    expect(
      validateFeatureTestSource(
        "src/components/Example/Example.po.tsx",
        `import { mockApiResponse } from "src/tests/mocks/mockApiResponse";\n`,
      ),
    ).toEqual([]);

    expect(
      validateFeatureTestSource(
        "src/hooks/useCollectionData.hook.spec.ts",
        `import { mockApiResponse } from "src/tests/mocks/mockApiResponse";\n`,
      ),
    ).toEqual([]);
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
