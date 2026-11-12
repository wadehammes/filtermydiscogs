import { describe, expect, it } from "@jest/globals";
import {
  applyToolEditToSource,
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

  it("scopes StrReplace violations to touched lines", () => {
    const existing = `const ok = 1;
const bad: any = 2;
`;

    const violations = validateHandbookEdit(
      "src/utils/example.ts",
      applyToolEditToSource({
        existingSource: existing,
        toolName: "StrReplace",
        oldString: "const ok = 1;",
        newString: "const ok = 2;",
      }) ?? "",
      {
        toolName: "StrReplace",
        existingSource: existing,
        oldString: "const ok = 1;",
        newString: "const ok = 2;",
      },
    );

    expect(violations).toHaveLength(0);
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
