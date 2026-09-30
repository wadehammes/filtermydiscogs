import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const repoRoot = process.cwd();

function readRepoFile(relativePath: string): string {
  return readFileSync(join(repoRoot, relativePath), "utf8");
}

describe("mswInfraContract", () => {
  it("uses jest-fixed-jsdom for MSW 3 fetch streams", () => {
    expect(readRepoFile("jest.config.ts")).toContain(
      'testEnvironment: "jest-fixed-jsdom"',
    );
  });

  it("configures MSW 3 onUnhandledFrame in Jest setup", () => {
    const setup = readRepoFile("src/tests/msw/setupMswInJest.ts");
    expect(setup).toContain("onUnhandledFrame:");
    expect(setup).not.toMatch(/onUnhandledRequest\s*:/);
  });

  it("configures MSW 3 onUnhandledFrame in Playwright fixture", () => {
    const fixture = readRepoFile("e2e/fixtures/msw.fixture.ts");
    expect(fixture).toContain("onUnhandledFrame:");
    expect(fixture).not.toMatch(/onUnhandledRequest\s*:/);
  });

  it("patches relative fetch URLs for Node fetch in Jest", () => {
    expect(readRepoFile(".jest/patchFetchForRelativeUrls.ts")).toContain(
      "patchFetchForRelativeUrls",
    );
    expect(readRepoFile("jest.config.ts")).toContain(
      "patchFetchForRelativeUrls.ts",
    );
  });
});
