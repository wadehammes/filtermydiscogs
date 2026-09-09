import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("theme-init generation", () => {
  it("matches generate:theme-init output", () => {
    const before = readFileSync(
      join(process.cwd(), "public/theme-init.js"),
      "utf8",
    );

    execSync("pnpm generate:theme-init", {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    const after = readFileSync(
      join(process.cwd(), "public/theme-init.js"),
      "utf8",
    );
    expect(after).toBe(before);
  });
});
