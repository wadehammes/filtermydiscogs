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

const jestMockedQueryHookPattern =
  /jest\.mocked\s*\(\s*use[A-Z][a-zA-Z0-9]*Query\s*\)/;

const jestMockedMutationHookPattern =
  /jest\.mocked\s*\(\s*use[A-Z][a-zA-Z0-9]*Mutation\s*\)/;

export const isFeatureTestFile = (relativePath: string): boolean =>
  FEATURE_TEST_SUFFIXES.some((suffix) => relativePath.endsWith(suffix));

export const isHandbookTestRulesAllowlisted = (relativePath: string): boolean =>
  HANDBOOK_TEST_RULES_ALLOWLIST.some((pattern) => pattern.test(relativePath));

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
  listFeatureTestFiles(rootDir).flatMap((filePath) => {
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
