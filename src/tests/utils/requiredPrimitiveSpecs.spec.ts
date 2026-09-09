import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "@jest/globals";

const REQUIRED_PRIMITIVE_SPECS = [
  "src/components/Select/Select.spec.tsx",
  "src/components/AutocompleteSelect/AutocompleteSelect.spec.tsx",
  "src/components/OverlayStack/OverlayStack.spec.tsx",
  "src/components/InlinePopoverMenu/InlinePopoverMenu.spec.tsx",
  "src/components/ReleasesClient/ReleasesGrid.module.css.spec.ts",
  "src/utils/themeAppearance.spec.ts",
  "src/utils/themeInitGeneration.spec.ts",
] as const;

describe("requiredPrimitiveSpecs", () => {
  it.each(REQUIRED_PRIMITIVE_SPECS)(
    "keeps contract coverage for %s",
    (specPath) => {
      expect(existsSync(join(process.cwd(), specPath))).toBe(true);
    },
  );
});
