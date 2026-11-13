import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  formatHandbookTestViolations,
  type HandbookTestViolation,
  isHandbookScannedTestFile,
  validateFeatureTestSource,
} from "src/tests/utils/handbookTestRules";
import { listScannedRepoFiles } from "src/tests/utils/listScannedRepoFiles";

export type HandbookEditViolation = HandbookTestViolation;

const NEXT_APP_FILE =
  /\/(page|layout|loading|error|not-found|template|default)\.tsx$/;

const NEXT_ROUTE_FILE = /\/route\.ts$/;

const isFlatDescribeSpec = (relativePath: string): boolean =>
  /\.hook\.spec\.tsx?$/.test(relativePath) ||
  /^src\/utils\/.*\.spec\.ts$/.test(relativePath) ||
  /^src\/lib\/.*\.spec\.ts$/.test(relativePath) ||
  (/^src\/components\/.*\.spec\.tsx$/.test(relativePath) &&
    !/\.hook\.spec\.tsx$/.test(relativePath)) ||
  /^src\/context\/releasePlayback\.context\..*\.spec\.tsx$/.test(relativePath);

const INDENTED_NESTED_DESCRIBE_CALL = /^[ \t]+describe\s*\(\s*(?:["'`]|$)/;

const startsMultilineImportBlock = (line: string): boolean =>
  /^\s*import\s+(?:type\s+)?\{/.test(line) && !/\}\s+from\s+["']/.test(line);

const endsMultilineImportBlock = (line: string): boolean =>
  /\}\s+from\s+["']/.test(line);

const isProductionSource = (relativePath: string): boolean =>
  relativePath.startsWith("src/") &&
  !relativePath.startsWith("src/@types/") &&
  !relativePath.includes(".spec.") &&
  !relativePath.endsWith(".po.tsx") &&
  !relativePath.startsWith("src/tests/");

const isHandbookGuardScope = (relativePath: string): boolean =>
  (relativePath.startsWith("src/") &&
    (relativePath.endsWith(".ts") || relativePath.endsWith(".tsx"))) ||
  (relativePath.startsWith("e2e/") && relativePath.endsWith(".ts"));

export const applyToolEditToSource = ({
  existingSource,
  toolName,
  content,
  oldString,
  newString,
}: {
  existingSource: string;
  toolName: string;
  content?: string;
  oldString?: string;
  newString?: string;
}): string | null => {
  if (toolName === "Write") {
    return content ?? "";
  }

  if (toolName === "StrReplace") {
    if (!oldString) {
      return existingSource;
    }

    if (!existingSource.includes(oldString)) {
      return existingSource;
    }

    return existingSource.replace(oldString, newString ?? "");
  }

  return null;
};

const validateFlatDescribe = (
  relativePath: string,
  source: string,
): HandbookEditViolation[] => {
  if (!isFlatDescribeSpec(relativePath)) {
    return [];
  }

  const violations: HandbookEditViolation[] = [];
  const lines = source.split("\n");
  let inMultilineImport = false;

  for (const [index, line] of lines.entries()) {
    if (startsMultilineImportBlock(line)) {
      inMultilineImport = true;
    }

    if (inMultilineImport) {
      if (endsMultilineImportBlock(line)) {
        inMultilineImport = false;
      }
      continue;
    }

    if (INDENTED_NESTED_DESCRIBE_CALL.test(line)) {
      violations.push({
        filePath: relativePath,
        line: index + 1,
        rule: "nested-describe",
        message:
          'Use one flat describe per hook/util spec — no nested describe("when …"). Fold scenarios into it("when …") names. See docs/handbook/conventions.md (Hook and feature spec checklist → Structure).',
        excerpt: line.trim(),
      });
    }
  }

  return violations;
};

const allowsFunctionDeclaration = (relativePath: string): boolean =>
  NEXT_ROUTE_FILE.test(relativePath) ||
  NEXT_APP_FILE.test(relativePath) ||
  relativePath === "src/middleware.ts" ||
  relativePath.startsWith("scripts/");

const validateProductionSource = (
  relativePath: string,
  source: string,
): HandbookEditViolation[] => {
  if (!isProductionSource(relativePath)) {
    return [];
  }

  const violations: HandbookEditViolation[] = [];
  const lines = source.split("\n");

  for (const [index, line] of lines.entries()) {
    if (/\bReact\.FC\b|: FC\b|\bFC\s*</.test(line)) {
      violations.push({
        filePath: relativePath,
        line: index + 1,
        rule: "react-fc",
        message:
          "Do not use React.FC / FC — use arrow components with typed props. See docs/handbook/conventions.md (TypeScript).",
        excerpt: line.trim(),
      });
    }

    if (/:\s*any\b|<\s*any\s*>|\bas\s+any\b/.test(line)) {
      violations.push({
        filePath: relativePath,
        line: index + 1,
        rule: "no-explicit-any",
        message:
          "Do not use any — use proper types. See docs/handbook/conventions.md (TypeScript).",
        excerpt: line.trim(),
      });
    }

    if (
      !allowsFunctionDeclaration(relativePath) &&
      /^\s*export\s+function\s+[A-Z]/.test(line)
    ) {
      violations.push({
        filePath: relativePath,
        line: index + 1,
        rule: "export-function-component",
        message:
          "Use arrow functions for app components and helpers — export const Name = () => {}. Exceptions: Next.js route/page/layout exports. See docs/handbook/conventions.md (TypeScript).",
        excerpt: line.trim(),
      });
    }

    if (
      /^\s*export\s+function\s+use[A-Z]/.test(line) &&
      !allowsFunctionDeclaration(relativePath)
    ) {
      violations.push({
        filePath: relativePath,
        line: index + 1,
        rule: "export-function-hook",
        message:
          "Hooks must use arrow functions — export const useFoo = () => {}. See docs/handbook/conventions.md (TypeScript).",
        excerpt: line.trim(),
      });
    }

    if (/from\s+["']\.\.\/\.\./.test(line) && !line.includes(".module.css")) {
      violations.push({
        filePath: relativePath,
        line: index + 1,
        rule: "deep-relative-import",
        message:
          'Prefer absolute imports from "src/…" — avoid crossing src/ with ../../. See docs/handbook/conventions.md (TypeScript).',
        excerpt: line.trim(),
      });
    }
  }

  return violations;
};

export const findHandbookViolations = (
  relativePath: string,
  source: string,
): HandbookEditViolation[] => {
  const normalized = relativePath.replace(/\\/g, "/");

  if (!isHandbookGuardScope(normalized)) {
    return [];
  }

  const featureTestViolations = isHandbookScannedTestFile(normalized)
    ? validateFeatureTestSource(normalized, source)
    : [];

  return [
    ...featureTestViolations,
    ...validateFlatDescribe(normalized, source),
    ...validateProductionSource(normalized, source),
  ];
};

const listHandbookGuardScannedFiles = (rootDir: string): string[] =>
  listScannedRepoFiles({
    rootDir,
    scanRoots: ["src", "e2e"],
    matchesPath: isHandbookGuardScope,
  });

export const collectHandbookRepoViolations = (
  rootDir: string,
): HandbookEditViolation[] =>
  listHandbookGuardScannedFiles(rootDir).flatMap((filePath) => {
    const source = readFileSync(join(rootDir, filePath), "utf8");
    return findHandbookViolations(filePath, source);
  });

const handbookViolationKey = (violation: HandbookEditViolation) =>
  `${violation.rule}\u0000${violation.excerpt}`;

const violationCountByRule = (violations: HandbookEditViolation[]) => {
  const counts = new Map<string, number>();

  for (const { rule } of violations) {
    counts.set(rule, (counts.get(rule) ?? 0) + 1);
  }

  return counts;
};

const withoutUnchangedViolations = ({
  afterViolations,
  beforeViolations,
}: {
  afterViolations: HandbookEditViolation[];
  beforeViolations: HandbookEditViolation[];
}) => {
  const existingCounts = new Map<string, number>();

  for (const violation of beforeViolations) {
    const key = handbookViolationKey(violation);
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  return afterViolations.filter((violation) => {
    const key = handbookViolationKey(violation);
    const remaining = existingCounts.get(key) ?? 0;

    if (remaining > 0) {
      existingCounts.set(key, remaining - 1);
      return false;
    }

    return true;
  });
};

export const newHandbookViolations = ({
  after,
  before,
  relativePath,
}: {
  after: string;
  before: string;
  relativePath: string;
}): HandbookEditViolation[] => {
  const normalized = relativePath.replace(/\\/g, "/");
  const beforeViolations = findHandbookViolations(normalized, before);
  const afterViolations = findHandbookViolations(normalized, after);
  const beforeCounts = violationCountByRule(beforeViolations);
  const afterCounts = violationCountByRule(afterViolations);
  const rulesThatGrew = new Set(
    [...afterCounts].flatMap(([rule, count]) =>
      count > (beforeCounts.get(rule) ?? 0) ? [rule] : [],
    ),
  );

  return withoutUnchangedViolations({
    afterViolations,
    beforeViolations,
  }).filter(({ rule }) => rulesThatGrew.has(rule));
};

export const lineNumbersTouchedByReplace = (
  source: string,
  oldString: string,
  newString: string,
): Set<number> => {
  const index = source.indexOf(oldString);

  if (index < 0) {
    return new Set();
  }

  const before = source.slice(0, index);
  const startLine = before.split("\n").length;
  const oldLines = oldString.split("\n").length;
  const newLines = newString.split("\n").length;
  const endLine = startLine + Math.max(oldLines, newLines) - 1;
  const touched = new Set<number>();

  for (let line = Math.max(1, startLine - 12); line <= endLine; line += 1) {
    touched.add(line);
  }

  return touched;
};

const filterViolationsToLines = (
  violations: HandbookEditViolation[],
  allowedLines: Set<number> | null,
): HandbookEditViolation[] => {
  if (allowedLines === null) {
    return violations;
  }

  return violations.filter((violation) => allowedLines.has(violation.line));
};

export const validateHandbookEdit = (
  relativePath: string,
  source: string,
  options?: {
    toolName?: string;
    existingSource?: string;
    oldString?: string;
    newString?: string;
  },
): HandbookEditViolation[] => {
  const normalized = relativePath.replace(/\\/g, "/");

  if (!isHandbookGuardScope(normalized)) {
    return [];
  }

  const allViolations = [
    ...validateFeatureTestSource(normalized, source),
    ...validateFlatDescribe(normalized, source),
    ...validateProductionSource(normalized, source),
  ];

  const toolName = options?.toolName ?? "Write";

  if (toolName === "Write") {
    return allViolations;
  }

  const existingSource = options?.existingSource ?? source;
  const oldString = options?.oldString ?? "";
  const newString = options?.newString ?? "";
  const touched = lineNumbersTouchedByReplace(
    existingSource,
    oldString,
    newString,
  );

  if (touched.size === 0) {
    return [];
  }

  return filterViolationsToLines(allViolations, touched);
};

export const formatHandbookEditViolations = (
  violations: HandbookEditViolation[],
): string => formatHandbookTestViolations(violations);
