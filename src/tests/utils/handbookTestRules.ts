import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type HandbookTestViolation = {
  filePath: string;
  line: number;
  rule: string;
  message: string;
  excerpt: string;
};

export const FEATURE_TEST_SUFFIXES = [
  ".spec.ts",
  ".spec.tsx",
  ".po.tsx",
] as const;

export const HANDBOOK_TEST_RULES_ALLOWLIST = [
  /^src\/tests\/utils\/handbookTestRules\.spec\.ts$/,
] as const;

const QUERY_HOOK_IMPORT_PATTERN =
  /from\s+["']src\/hooks\/queries\/use[A-Za-z0-9]+["']/;

const MUTATION_HOOK_IMPORT_PATTERN =
  /from\s+["']src\/hooks\/mutations\/use[A-Za-z0-9]+["']/;

export const FORBIDDEN_HOOK_LAYER_SPEC_PATH =
  /^src\/hooks\/(mutations|queries)\/.+\.(spec|po)\.(ts|tsx)$/;

const FORBIDDEN_HOOK_LAYER_SPEC_MESSAGE =
  "Do not add specs under src/hooks/queries/ or src/hooks/mutations/. Cover read/write behavior at call sites (components, feature hooks, contexts) with mocked api.*. See docs/handbook/conventions.md (Do not test React Query).";

const QUERY_HOOK_MOCK_LINE_RULES = [
  {
    rule: "jest-mock-query-hook",
    pattern: /jest\.mock\s*\(\s*["']src\/hooks\/queries\//,
    message:
      "Do not jest.mock query hooks under src/hooks/queries/. Mock src/api/urls and let the real query hook run in TestProviders. See docs/handbook/conventions.md (Do not test React Query).",
  },
  {
    rule: "setup-discogs-release-query-mock",
    pattern: /setupDiscogsReleaseQueryMock/,
    message:
      "Use setupFetchDiscogsReleaseMock to stub discogsRelease instead of mocking useDiscogsReleaseQuery.",
  },
] as const;

const MUTATION_HOOK_MOCK_LINE_RULES = [
  {
    rule: "jest-mock-mutation-hook",
    pattern: /jest\.mock\s*\(\s*["']src\/hooks\/mutations\//,
    message:
      "Do not jest.mock mutation hooks under src/hooks/mutations/. Mock src/api/urls and assert outcomes in components or feature hooks. See docs/handbook/conventions.md (Do not test React Query).",
  },
] as const;

const NESTED_FACTORY_LOOKBACK_LINES = 12;

const DISCOGS_VIDEO_FACTORY_CONTEXT =
  /discogsVideoFactory\.(youtube|nonYoutube|build)\s*\(/;

const DISCOGS_TRACK_FACTORY_CONTEXT =
  /discogsTrackFactory\.(build|untitled)\s*\(/;

const INLINE_DISCOGS_VIDEO_EMBED_PATTERN = /embed:\s*true/;

const INLINE_DISCOGS_TRACK_TYPE_PATTERN = /type_:\s*"track"/;

const INLINE_DISCOGS_VIDEO_URI_PATTERN =
  /^\s+uri:\s*["']https?:\/\/[^"']*youtube[^"']*watch\?v=/i;

const INLINE_DISCOGS_VIDEO_EMBED_MESSAGE =
  "Do not use inline DiscogsVideo objects (embed: true). Use discogsVideoFactory.youtube({ … }) or discogsVideoFactory.build({ … }). See docs/handbook/conventions.md (Test data and factories → Nested release detail rows).";

const INLINE_DISCOGS_TRACK_TYPE_MESSAGE =
  'Do not use inline DiscogsTrack objects (type_: "track"). Use discogsTrackFactory.build({ … }) or discogsTrackFactory.untitled({ … }). See docs/handbook/conventions.md (Test data and factories → Nested release detail rows).';

const INLINE_DISCOGS_VIDEO_URI_MESSAGE =
  "Do not set inline YouTube uri: on DiscogsVideo literals. Use discogsVideoFactory.youtube({ uri: … }). See docs/handbook/conventions.md (Test data and factories → Nested release detail rows).";

const recentLinesIncludePattern = (
  lines: string[],
  lineIndex: number,
  pattern: RegExp,
): boolean => {
  const start = Math.max(0, lineIndex - NESTED_FACTORY_LOOKBACK_LINES);
  return (
    lines
      .slice(start, lineIndex + 1)
      .join("\n")
      .match(pattern) !== null
  );
};

const COMPONENT_SPEC_FORBIDDEN_IMPORT_RULES = [
  {
    rule: "component-spec-mock-api-response-import",
    pattern: /from\s+["']src\/tests\/mocks\/mockApiResponse["']/,
    message:
      "Component specs must not import mockApiResponse or mockPendingApiResponse. Wire api.* mocks in the co-located *.po.tsx page object. See docs/handbook/conventions.md (Page object pattern).",
  },
  {
    rule: "component-spec-setup-fetch-discogs-release-mock-import",
    pattern: /from\s+["']src\/tests\/mocks\/setupFetchDiscogsReleaseMock["']/,
    message:
      "Component specs must not import setupFetchDiscogsReleaseMock. Use a page object mock* method or setupReleaseOpenPrefetchApiMocks via ReleaseOpenPrefetchPageObject. See docs/handbook/conventions.md (Page object pattern).",
  },
] as const;

export const isComponentSpecFile = (relativePath: string): boolean =>
  relativePath.startsWith("src/components/") &&
  relativePath.endsWith(".spec.tsx") &&
  !relativePath.endsWith(".hook.spec.tsx");

const jestMockedQueryHookPattern =
  /jest\.mocked\s*\(\s*use[A-Z][a-zA-Z0-9]*Query\s*\)/;

const jestMockedMutationHookPattern =
  /jest\.mocked\s*\(\s*use[A-Z][a-zA-Z0-9]*Mutation\s*\)/;

export const isFeatureTestFile = (relativePath: string): boolean =>
  FEATURE_TEST_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));

export const isE2eHandbookScannedFile = (relativePath: string): boolean =>
  relativePath.startsWith("e2e/helpers/") && relativePath.endsWith(".ts");

export const isHandbookScannedTestFile = (relativePath: string): boolean =>
  isFeatureTestFile(relativePath) ||
  isE2eHandbookScannedFile(relativePath) ||
  (relativePath.startsWith("e2e/") && relativePath.endsWith(".spec.ts"));

export const isHandbookTestRulesAllowlisted = (relativePath: string): boolean =>
  HANDBOOK_TEST_RULES_ALLOWLIST.some((pattern) => pattern.test(relativePath));

const listHandbookScannedTestFiles = (rootDir: string): string[] => {
  const files: string[] = [];

  const walk = (directory: string, relativeRoot: string) => {
    for (const entry of readdirSync(directory)) {
      const absolutePath = join(directory, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath, relativeRoot);
        continue;
      }

      const relativePath = relative(relativeRoot, absolutePath).replace(
        /\\/g,
        "/",
      );

      if (isHandbookScannedTestFile(relativePath)) {
        files.push(relativePath);
      }
    }
  };

  walk(join(rootDir, "src"), rootDir);
  walk(join(rootDir, "e2e"), rootDir);
  return files.sort();
};

export const validateFeatureTestPath = (
  filePath: string,
): HandbookTestViolation[] => {
  if (isHandbookTestRulesAllowlisted(filePath)) {
    return [];
  }

  if (!FORBIDDEN_HOOK_LAYER_SPEC_PATH.test(filePath)) {
    return [];
  }

  return [
    {
      filePath,
      line: 1,
      rule: "forbidden-hook-layer-spec",
      message: FORBIDDEN_HOOK_LAYER_SPEC_MESSAGE,
      excerpt: filePath,
    },
  ];
};

export const validateFeatureTestSource = (
  filePath: string,
  source: string,
): HandbookTestViolation[] => {
  const pathViolations = validateFeatureTestPath(filePath);

  if (isHandbookTestRulesAllowlisted(filePath)) {
    return pathViolations;
  }

  const importsQueryHook = QUERY_HOOK_IMPORT_PATTERN.test(source);
  const importsMutationHook = MUTATION_HOOK_IMPORT_PATTERN.test(source);
  const violations: HandbookTestViolation[] = [...pathViolations];
  const isComponentSpec = isComponentSpecFile(filePath);
  const lines = source.split("\n");

  for (const [index, line] of lines.entries()) {
    if (INLINE_DISCOGS_VIDEO_EMBED_PATTERN.test(line)) {
      violations.push({
        filePath,
        line: index + 1,
        rule: "inline-discogs-video-embed",
        message: INLINE_DISCOGS_VIDEO_EMBED_MESSAGE,
        excerpt: line.trim(),
      });
    }

    if (
      INLINE_DISCOGS_TRACK_TYPE_PATTERN.test(line) &&
      !line.includes("discogsTrackFactory") &&
      !recentLinesIncludePattern(lines, index, DISCOGS_TRACK_FACTORY_CONTEXT)
    ) {
      violations.push({
        filePath,
        line: index + 1,
        rule: "inline-discogs-track-type",
        message: INLINE_DISCOGS_TRACK_TYPE_MESSAGE,
        excerpt: line.trim(),
      });
    }

    if (
      INLINE_DISCOGS_VIDEO_URI_PATTERN.test(line) &&
      !recentLinesIncludePattern(lines, index, DISCOGS_VIDEO_FACTORY_CONTEXT)
    ) {
      violations.push({
        filePath,
        line: index + 1,
        rule: "inline-discogs-video-uri",
        message: INLINE_DISCOGS_VIDEO_URI_MESSAGE,
        excerpt: line.trim(),
      });
    }

    if (isComponentSpec) {
      for (const {
        rule,
        pattern,
        message,
      } of COMPONENT_SPEC_FORBIDDEN_IMPORT_RULES) {
        if (pattern.test(line)) {
          violations.push({
            filePath,
            line: index + 1,
            rule,
            message,
            excerpt: line.trim(),
          });
        }
      }
    }

    for (const { rule, pattern, message } of QUERY_HOOK_MOCK_LINE_RULES) {
      if (pattern.test(line)) {
        violations.push({
          filePath,
          line: index + 1,
          rule,
          message,
          excerpt: line.trim(),
        });
      }
    }

    for (const { rule, pattern, message } of MUTATION_HOOK_MOCK_LINE_RULES) {
      if (pattern.test(line)) {
        violations.push({
          filePath,
          line: index + 1,
          rule,
          message,
          excerpt: line.trim(),
        });
      }
    }

    if (importsQueryHook && jestMockedQueryHookPattern.test(line)) {
      violations.push({
        filePath,
        line: index + 1,
        rule: "jest-mocked-query-hook",
        message:
          "Do not jest.mocked() query hooks from src/hooks/queries/. Mock src/api/urls instead. See docs/handbook/conventions.md (Do not test React Query).",
        excerpt: line.trim(),
      });
    }

    if (importsMutationHook && jestMockedMutationHookPattern.test(line)) {
      violations.push({
        filePath,
        line: index + 1,
        rule: "jest-mocked-mutation-hook",
        message:
          "Do not jest.mocked() mutation hooks from src/hooks/mutations/. Mock src/api/urls instead. See docs/handbook/conventions.md (Do not test React Query).",
        excerpt: line.trim(),
      });
    }
  }

  return violations;
};

export const collectHandbookTestViolations = (
  rootDir: string,
): HandbookTestViolation[] =>
  listHandbookScannedTestFiles(rootDir).flatMap((filePath) => {
    const source = readFileSync(join(rootDir, filePath), "utf8");
    return validateFeatureTestSource(filePath, source);
  });

export const formatHandbookTestViolations = (
  violations: HandbookTestViolation[],
): string =>
  violations
    .map(
      (violation) =>
        `${violation.filePath}:${violation.line} [${violation.rule}] ${violation.message}\n  ${violation.excerpt}`,
    )
    .join("\n\n");
