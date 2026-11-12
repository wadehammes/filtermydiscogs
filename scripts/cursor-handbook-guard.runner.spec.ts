import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it } from "@jest/globals";
import {
  applyToolEditToSource,
  formatHandbookEditViolations,
  newHandbookViolations,
} from "src/tests/utils/handbookEditGuard";

type HookInput = {
  cwd?: string;
  tool_name?: string;
  tool_input?: {
    file_path?: string;
    path?: string;
    content?: string;
    old_string?: string;
    new_string?: string;
  };
};

const relativePathFromHook = (root: string, filePath: string): string => {
  const normalized = filePath.replace(/\\/g, "/");

  if (normalized.startsWith(`${root}/`)) {
    return normalized.slice(root.length + 1);
  }

  return normalized.replace(/^\.\//, "");
};

const runCursorHandbookGuard = (hookJson: string): string => {
  const hookPayload = JSON.parse(hookJson) as HookInput;
  const root = hookPayload.cwd ?? process.cwd();
  const toolInput = hookPayload.tool_input ?? {};
  const filePath = toolInput.file_path ?? toolInput.path ?? "";

  if (!filePath) {
    return "";
  }

  const relativePath = relativePathFromHook(root, filePath);
  const toolName =
    hookPayload.tool_name ??
    (toolInput.content !== undefined ? "Write" : "StrReplace");
  const absPath = join(root, relativePath);
  const existing = existsSync(absPath) ? readFileSync(absPath, "utf8") : "";

  const resulting = applyToolEditToSource({
    existingSource: existing,
    toolName,
    content: toolInput.content,
    oldString: toolInput.old_string,
    newString: toolInput.new_string,
  });

  if (resulting === null) {
    return "";
  }

  const violations = newHandbookViolations({
    after: resulting,
    before: existing,
    relativePath,
  });

  if (violations.length === 0) {
    return "";
  }

  return formatHandbookEditViolations(violations);
};

describe("cursorHandbookGuardRunner", () => {
  it("validates hook stdin from CURSOR_HANDBOOK_GUARD_STDIN", () => {
    const hookJson = process.env.CURSOR_HANDBOOK_GUARD_STDIN;

    if (!hookJson) {
      return;
    }

    const violationReport = runCursorHandbookGuard(hookJson);

    if (violationReport) {
      throw new Error(violationReport);
    }
  });
});
