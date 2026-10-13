import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import { E2E_SMOKE_SPEC_FILES } from "../../../e2e/smokeSpecs.constants";

describe("smokeSpecs.constants", () => {
  it("lists existing Playwright spec files under e2e/", () => {
    const e2eDir = join(__dirname, "../../../e2e");

    for (const file of E2E_SMOKE_SPEC_FILES) {
      expect(existsSync(join(e2eDir, file))).toBe(true);
    }
  });
});
