import { describe, expect, it } from "@jest/globals";
import {
  collectHandbookRepoViolations,
  formatHandbookEditViolations,
} from "src/tests/utils/handbookEditGuard";

describe("handbookRepoAudit", () => {
  it("keeps src/ and e2e/ free of handbook guard violations", () => {
    const violations = collectHandbookRepoViolations(process.cwd());

    if (violations.length > 0) {
      throw new Error(formatHandbookEditViolations(violations));
    }

    expect(violations).toEqual([]);
  });
});
