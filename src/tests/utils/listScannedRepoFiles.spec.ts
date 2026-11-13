import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import { listScannedRepoFiles } from "src/tests/utils/listScannedRepoFiles";

describe("listScannedRepoFiles", () => {
  it("when the predicate matches production files, returns sorted repo-relative paths", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "listScannedRepoFiles-"));
    mkdirSync(join(rootDir, "src/utils"), { recursive: true });
    mkdirSync(join(rootDir, "e2e"), { recursive: true });
    writeFileSync(join(rootDir, "src/utils/foo.ts"), "");
    writeFileSync(join(rootDir, "src/utils/foo.spec.ts"), "");
    writeFileSync(join(rootDir, "e2e/smoke.spec.ts"), "");

    expect(
      listScannedRepoFiles({
        rootDir,
        scanRoots: ["src", "e2e"],
        matchesPath: (relativePath) =>
          relativePath.endsWith(".ts") && !relativePath.includes(".spec."),
      }),
    ).toEqual(["src/utils/foo.ts"]);
  });

  it("when scan roots are limited, only walks those directories", () => {
    const rootDir = mkdtempSync(join(tmpdir(), "listScannedRepoFiles-"));
    mkdirSync(join(rootDir, "src/utils"), { recursive: true });
    mkdirSync(join(rootDir, "e2e"), { recursive: true });
    writeFileSync(join(rootDir, "e2e/only.ts"), "");

    expect(
      listScannedRepoFiles({
        rootDir,
        scanRoots: ["e2e"],
        matchesPath: (relativePath) => relativePath.endsWith(".ts"),
      }),
    ).toEqual(["e2e/only.ts"]);
  });
});
