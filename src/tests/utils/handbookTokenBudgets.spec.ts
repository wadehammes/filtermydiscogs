import path from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  collectHandbookBudgetViolations,
  formatHandbookBudgetViolations,
  LEGACY_OVERSIZED_PAGES,
} from "src/tests/utils/handbookTokenBudgets";

describe("handbookTokenBudgets", () => {
  it("keeps handbook within token budgets", () => {
    const root = path.resolve(process.cwd());
    const violations = collectHandbookBudgetViolations(
      root,
      LEGACY_OVERSIZED_PAGES,
    );

    if (violations.length > 0) {
      throw new Error(formatHandbookBudgetViolations(violations));
    }

    expect(violations).toEqual([]);
  });
});
