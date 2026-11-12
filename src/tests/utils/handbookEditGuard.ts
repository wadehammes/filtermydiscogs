import {
  formatHandbookTestViolations,
  type HandbookTestViolation,
  validateFeatureTestSource,
} from "src/tests/utils/handbookTestRules";

export type HandbookEditViolation = HandbookTestViolation;

const NEXT_APP_FILE =
  /\/(page|layout|loading|error|not-found|template|default)\.tsx$/;

const NEXT_ROUTE_FILE = /\/route\.ts$/;

const isFlatDescribeSpec = (relativePath: string): boolean =>
  /\.hook\.spec\.tsx?$/.test(relativePath) ||
  /^src\/utils\/.*\.spec\.ts$/.test(relativePath) ||
  /^src\/context\/releasePlayback\.context\..*\.spec\.tsx$/.test(relativePath);

const isProductionSource = (relativePath: string): boolean =>
  relativePath.startsWith("src/") &&
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

  for (const [index, line] of lines.entries()) {
    if (/^[ \t]+describe\s*\(/.test(line)) {
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
