import { describe, expect, it } from "@jest/globals";
import { releaseFactory } from "src/tests/factories/Release.factory";
import { getOnThisDayReleases } from "src/utils/onThisDay";

describe("getOnThisDayReleases", () => {
  it("returns matching releases in chronological order by date added", () => {
    const today = new Date();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const day = String(today.getDate()).padStart(2, "0");

    const releases = [
      releaseFactory.build({
        date_added: `${today.getFullYear() - 1}-${month}-${day}T12:00:00`,
      }),
      releaseFactory.build({
        date_added: `${today.getFullYear() - 5}-${month}-${day}T12:00:00`,
      }),
      releaseFactory.build({
        date_added: `${today.getFullYear() - 3}-${month}-${day}T12:00:00`,
      }),
      releaseFactory.build({
        date_added: `${today.getFullYear()}-${month}-${day}T12:00:00`,
      }),
    ];

    const result = getOnThisDayReleases(releases);

    expect(result).toHaveLength(3);
    expect(new Date(result[0]?.date_added ?? "").getFullYear()).toBe(
      today.getFullYear() - 5,
    );
    expect(new Date(result[1]?.date_added ?? "").getFullYear()).toBe(
      today.getFullYear() - 3,
    );
    expect(new Date(result[2]?.date_added ?? "").getFullYear()).toBe(
      today.getFullYear() - 1,
    );
  });
});
