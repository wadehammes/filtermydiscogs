import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

export type QueryHookMockViolation = {
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

export const QUERY_HOOK_MOCK_ALLOWLIST = [
  /^src\/hooks\/queries\/.*\.spec\.tsx?$/,
  /^src\/tests\/utils\/queryHookMockRules\.spec\.ts$/,
] as const;

const QUERY_HOOK_IMPORT_PATTERN =
  /from\s+["']src\/hooks\/queries\/use[A-Za-z0-9]+["']/;

const QUERY_HOOK_MOCK_LINE_RULES = [
  {
    rule: "jest-mock-query-hook",
    pattern: /jest\.mock\s*\(\s*["']src\/hooks\/queries\//,
    message:
      "Do not jest.mock query hooks under src/hooks/queries/. Mock src/api/helpers and let the real query hook run in TestProviders. See docs/handbook/conventions.md (Do not test React Query).",
  },
  {
    rule: "setup-discogs-release-query-mock",
    pattern: /setupDiscogsReleaseQueryMock/,
    message:
      "Use setupFetchDiscogsReleaseMock to stub fetchDiscogsRelease instead of mocking useDiscogsReleaseQuery.",
  },
] as const;

const jestMockedQueryHookPattern =
  /jest\.mocked\s*\(\s*use[A-Z][a-zA-Z0-9]*Query\s*\)/;

export const isFeatureTestFile = (relativePath: string): boolean =>
  FEATURE_TEST_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));

export const isQueryHookMockAllowlisted = (relativePath: string): boolean =>
  QUERY_HOOK_MOCK_ALLOWLIST.some((pattern) => pattern.test(relativePath));

const listFeatureTestFiles = (rootDir: string): string[] => {
  const files: string[] = [];

  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const absolutePath = join(directory, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const relativePath = relative(rootDir, absolutePath).replace(/\\/g, "/");

      if (isFeatureTestFile(relativePath)) {
        files.push(relativePath);
      }
    }
  };

  walk(join(rootDir, "src"));
  return files.sort();
};

export const validateFeatureTestSource = (
  filePath: string,
  source: string,
): QueryHookMockViolation[] => {
  if (isQueryHookMockAllowlisted(filePath)) {
    return [];
  }

  const importsQueryHook = QUERY_HOOK_IMPORT_PATTERN.test(source);
  const violations: QueryHookMockViolation[] = [];

  for (const [index, line] of source.split("\n").entries()) {
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

    if (importsQueryHook && jestMockedQueryHookPattern.test(line)) {
      violations.push({
        filePath,
        line: index + 1,
        rule: "jest-mocked-query-hook",
        message:
          "Do not jest.mocked() query hooks from src/hooks/queries/. Mock src/api/helpers instead. See docs/handbook/conventions.md (Do not test React Query).",
        excerpt: line.trim(),
      });
    }
  }

  return violations;
};

export const collectQueryHookMockViolations = (
  rootDir: string,
): QueryHookMockViolation[] =>
  listFeatureTestFiles(rootDir).flatMap((filePath) => {
    const source = readFileSync(join(rootDir, filePath), "utf8");
    return validateFeatureTestSource(filePath, source);
  });

export const formatQueryHookMockViolations = (
  violations: QueryHookMockViolation[],
): string =>
  violations
    .map(
      (violation) =>
        `${violation.filePath}:${violation.line} [${violation.rule}] ${violation.message}\n  ${violation.excerpt}`,
    )
    .join("\n\n");
