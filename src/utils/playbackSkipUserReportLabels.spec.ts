import { describe, expect, it } from "@jest/globals";
import { PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES } from "src/lib/validation/playbackSkipUserReport.schemas";
import {
  PLAYBACK_SKIP_USER_REPORT_CATEGORY_LABELS,
  PLAYBACK_SKIP_USER_REPORT_CATEGORY_OPTIONS,
} from "src/utils/playbackSkipUserReportLabels";

describe("playbackSkipUserReportLabels", () => {
  it("when building category options, covers every enum value with a label", () => {
    expect(PLAYBACK_SKIP_USER_REPORT_CATEGORY_OPTIONS).toHaveLength(
      PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES.length,
    );

    for (const value of PLAYBACK_SKIP_USER_REPORT_CATEGORY_VALUES) {
      const option = PLAYBACK_SKIP_USER_REPORT_CATEGORY_OPTIONS.find(
        (item) => item.value === value,
      );

      expect(option?.label).toBe(
        PLAYBACK_SKIP_USER_REPORT_CATEGORY_LABELS[value],
      );
      expect(option?.label.length).toBeGreaterThan(0);
    }
  });
});
