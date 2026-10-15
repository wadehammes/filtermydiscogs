import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

describe("releaseCardCoverBlurInitGeneration", () => {
  it("matches generate:release-card-cover-blur-init output", () => {
    const before = readFileSync(
      join(process.cwd(), "public/release-card-cover-blur-init.js"),
      "utf8",
    );

    execSync("pnpm generate:release-card-cover-blur-init", {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    const after = readFileSync(
      join(process.cwd(), "public/release-card-cover-blur-init.js"),
      "utf8",
    );
    expect(after).toBe(before);
  });
});
