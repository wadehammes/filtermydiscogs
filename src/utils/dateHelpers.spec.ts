import { describe, expect, it } from "@jest/globals";
import { formatDate } from "src/utils/dateHelpers";

describe("formatDate", () => {
  it("formats a valid ISO date in en-US short form", () => {
    expect(formatDate("2024-06-15T12:00:00.000Z")).toBe("Jun 15, 2024");
  });

  it("returns an invalid-date label for unparseable input", () => {
    expect(formatDate("not-a-date")).toBe("Invalid Date");
  });
});
