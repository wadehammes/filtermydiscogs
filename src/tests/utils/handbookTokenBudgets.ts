import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

export const TOKEN_BUDGETS = {
  alwaysLoaded: 8_000,
  handbookPage: 1_500,
  reviewCommand: 1_500,
} as const;

export const LEGACY_OVERSIZED_PAGES = new Set([
  "docs/handbook/README.md",
  "docs/handbook/architecture.md",
  "docs/handbook/components.md",
  "docs/handbook/conventions.md",
  "docs/handbook/database.md",
  "docs/handbook/decisions.md",
  "docs/handbook/discogs.md",
  "docs/handbook/factories.md",
  "docs/handbook/feature-guides/collection-command-palette.md",
  "docs/handbook/feature-guides/public-sharing.md",
  "docs/handbook/feature-guides/radio.md",
  "docs/handbook/llms.md",
  "docs/handbook/patterns.md",
  "docs/handbook/platform.md",
  "docs/handbook/playback-embed-invariants.md",
  "docs/handbook/playback-manual-queue.md",
  "docs/handbook/playback-embed-simplification.md",
  "docs/handbook/source-layout.md",
  ".cursor/commands/handbook-review.md",
]);

export const estimateTokens = (text: string): number =>
  Math.ceil(text.length / 4);

const readUtf8 = (root: string, relativePath: string): string => {
  const absolute = path.join(root, relativePath);
  return existsSync(absolute) ? readFileSync(absolute, "utf8") : "";
};

const llmsRoutingTableOnly = (llmsContent: string): string =>
  llmsContent
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .join("\n");

const listHandbookMarkdownFiles = (root: string): string[] => {
  const handbookDir = path.join(root, "docs/handbook");
  const files: string[] = [];

  const walk = (dir: string, prefix: string) => {
    for (const name of readdirSync(dir)) {
      const absolute = path.join(dir, name);
      const relative = path.posix.join(prefix, name);
      if (statSync(absolute).isDirectory()) {
        walk(absolute, relative);
      } else if (name.endsWith(".md")) {
        files.push(relative);
      }
    }
  };

  walk(handbookDir, "docs/handbook");
  return files.sort();
};

const overBudget = (
  label: string,
  tokens: number,
  budget: number,
  legacyGrandfather: Set<string>,
  relativePath?: string,
): string[] => {
  if (relativePath && legacyGrandfather.has(relativePath)) {
    return [];
  }
  return tokens > budget
    ? [`${label}: ~${tokens} tokens (budget ${budget})`]
    : [];
};

export const collectHandbookBudgetViolations = (
  root: string,
  legacyGrandfather: Set<string> = LEGACY_OVERSIZED_PAGES,
): string[] => {
  const agents = readUtf8(root, "AGENTS.md");
  const llmsTable = llmsRoutingTableOnly(
    readUtf8(root, "docs/handbook/llms.md"),
  );

  const violations: string[] = [
    ...overBudget(
      "always loaded (AGENTS.md + llms.md table rows)",
      estimateTokens(`${agents}\n${llmsTable}`),
      TOKEN_BUDGETS.alwaysLoaded,
      legacyGrandfather,
    ),
    ...listHandbookMarkdownFiles(root).flatMap((relativePath) =>
      overBudget(
        relativePath,
        estimateTokens(readUtf8(root, relativePath)),
        TOKEN_BUDGETS.handbookPage,
        legacyGrandfather,
        relativePath,
      ),
    ),
  ];

  const reviewCommand =
    readUtf8(root, ".cursor/commands/handbook-review.md") ||
    readUtf8(root, ".claude/commands/handbook-review.md");

  if (reviewCommand) {
    violations.push(
      ...overBudget(
        ".cursor/commands/handbook-review.md",
        estimateTokens(reviewCommand),
        TOKEN_BUDGETS.reviewCommand,
        legacyGrandfather,
        ".cursor/commands/handbook-review.md",
      ),
    );
  }

  return violations;
};

export const formatHandbookBudgetViolations = (violations: string[]): string =>
  [
    "Handbook token budget violations (chars/4 estimate):",
    ...violations.map((line) => `  - ${line}`),
    "",
    "See docs/handbook/agent-workflow.md → Context efficiency (tokens).",
  ].join("\n");
