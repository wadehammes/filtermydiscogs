import { expect, test } from "@playwright/test";
import { PALETTE_THEMES } from "../src/utils/themeAppearance";
import { THEME_CONTRAST_PAIRS } from "../src/utils/themeContrastPairs";
import {
  contrastRatio,
  meetsContrast,
  parseCssColorToRgb,
} from "../src/utils/wcagContrast";

test.describe("palette theme contrast", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  for (const theme of PALETTE_THEMES) {
    test(`${theme} meets WCAG AA on key token pairs`, async ({ page }) => {
      await page.evaluate((palette) => {
        document.documentElement.setAttribute("data-theme", palette);
      }, theme);

      const results = await page.evaluate((pairs) => {
        const probe = document.createElement("div");
        probe.setAttribute("data-testid", "themeContrastProbe");
        probe.style.position = "absolute";
        probe.style.visibility = "hidden";
        probe.style.pointerEvents = "none";
        document.body.appendChild(probe);

        return pairs.map((pair) => {
          probe.style.color = `var(${pair.foregroundVar})`;
          probe.style.backgroundColor = `var(${pair.backgroundVar})`;
          const styles = getComputedStyle(probe);
          return {
            id: pair.id,
            minimum: pair.minimum,
            foreground: styles.color,
            background: styles.backgroundColor,
          };
        });
      }, THEME_CONTRAST_PAIRS);

      const failures: string[] = [];

      for (const row of results) {
        const foregroundRgb = parseCssColorToRgb(row.foreground);
        const backgroundRgb = parseCssColorToRgb(row.background);

        if (foregroundRgb == null || backgroundRgb == null) {
          failures.push(
            `${row.id}: could not parse foreground=${row.foreground} background=${row.background}`,
          );
          continue;
        }

        const ratio = contrastRatio(foregroundRgb, backgroundRgb);
        if (!meetsContrast(ratio, row.minimum)) {
          failures.push(
            `${row.id}: ${ratio.toFixed(2)}:1 (need ${row.minimum}:1)`,
          );
        }
      }

      expect(
        failures,
        failures.length > 0 ? failures.join("\n") : undefined,
      ).toEqual([]);
    });
  }
});
