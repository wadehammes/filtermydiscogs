import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";
import {
  applyToolEditToSource,
  newHandbookViolations,
  validateHandbookEdit,
} from "src/tests/utils/handbookEditGuard";

describe("handbookEditGuard", () => {
  it("applyToolEditToSource replaces once for StrReplace", () => {
    const next = applyToolEditToSource({
      existingSource: "const a = 1;\nconst b = 2;\n",
      toolName: "StrReplace",
      oldString: "const a = 1;",
      newString: "const a = 2;",
    });

    expect(next).toBe("const a = 2;\nconst b = 2;\n");
  });

  it("flags nested describe in hook specs", () => {
    const source = `describe("useFoo", () => {
  describe("when", () => {
    it("works", () => {});
  });
});
`;

    const violations = validateHandbookEdit(
      "src/hooks/useFoo.hook.spec.ts",
      source,
    );

    expect(violations.some((v) => v.rule === "nested-describe")).toBe(true);
  });

  it("allows multiline @jest/globals import bindings (describe, jest, afterAll)", () => {
    const source = `import {
  afterAll,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";

describe("exampleUtil", () => {
  afterAll(() => {
    jest.restoreAllMocks();
  });

  it("when valid, passes", () => {});
});
`;

    const violations = validateHandbookEdit(
      "src/utils/exampleUtil.spec.ts",
      source,
    );

    expect(violations.some((v) => v.rule === "nested-describe")).toBe(false);
  });

  it("allows multiline import bindings when StrReplace touches describe, line", () => {
    const existing = `import {
  afterAll,
  describe,
  it,
} from "@jest/globals";

describe("exampleUtil", () => {
  it("when valid, passes", () => {});
});
`;

    const violations = validateHandbookEdit(
      "src/utils/exampleUtil.spec.ts",
      applyToolEditToSource({
        existingSource: existing,
        toolName: "StrReplace",
        oldString: "  afterAll,\n",
        newString: "  afterAll,\n  beforeEach,\n",
      }) ?? "",
      {
        toolName: "StrReplace",
        existingSource: existing,
        oldString: "  afterAll,\n",
        newString: "  afterAll,\n  beforeEach,\n",
      },
    );

    expect(violations.some((v) => v.rule === "nested-describe")).toBe(false);
  });

  it("allows real util spec with multiline @jest/globals import", () => {
    const source = readFileSync(
      join(process.cwd(), "src/utils/playbackSkippedTrackToast.spec.ts"),
      "utf8",
    );

    const violations = validateHandbookEdit(
      "src/utils/playbackSkippedTrackToast.spec.ts",
      source,
    );

    expect(violations.filter((v) => v.rule === "nested-describe")).toHaveLength(
      0,
    );
  });

  it("flags React.FC in components", () => {
    const source = `import type { FC } from "react";

export const Foo: FC = () => null;
`;

    const violations = validateHandbookEdit(
      "src/components/Foo/Foo.component.tsx",
      source,
    );

    expect(violations.some((v) => v.rule === "react-fc")).toBe(true);
  });

  it("allows export async function GET in route handlers", () => {
    const source = `export async function GET() {
  return new Response();
}
`;

    expect(
      validateHandbookEdit("src/app/api/health/route.ts", source),
    ).toHaveLength(0);
  });

  it("reports only violations an edit introduces", () => {
    const before = `export const ok = 1;
const bad: any = 2;
`;
    const after = `export const ok = 1;
const bad: any = 2;

const worse: any = 3;
`;

    expect(
      newHandbookViolations({
        after,
        before,
        relativePath: "src/utils/example.ts",
      }).map(({ line, rule }) => ({ line, rule })),
    ).toEqual([{ line: 4, rule: "no-explicit-any" }]);
  });

  it("reports nothing when an edit leaves an existing violation in place", () => {
    const before = "export const bad: any = 1;\n";
    const after = "export const bad: any = 2;\n";

    expect(
      newHandbookViolations({
        after,
        before,
        relativePath: "src/utils/example.ts",
      }),
    ).toEqual([]);
  });

  it("reuses handbook test rules for component specs", () => {
    const source = `import { mockApiResponse } from "src/tests/mocks/mockApiResponse";

describe("ReleaseModal", () => {
  it("renders", () => {});
});
`;

    const violations = validateHandbookEdit(
      "src/components/ReleaseModal/ReleaseModal.spec.tsx",
      source,
    );

    expect(
      violations.some(
        (v) => v.rule === "component-spec-mock-api-response-import",
      ),
    ).toBe(true);
  });
});
