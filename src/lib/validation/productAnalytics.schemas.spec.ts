import { describe, expect, it } from "@jest/globals";
import { validateProductAnalyticsBatch } from "src/lib/validation/productAnalytics.schemas";
import { PRODUCT_ANALYTICS_MAX_BATCH_SIZE } from "src/types/productAnalytics.types";

const validEvent = {
  event: "pageView",
  category: "navigation",
  action: "pageView",
  label: "Releases",
  value: "/releases",
  page_path: "/releases",
};

describe("validateProductAnalyticsBatch", () => {
  it("accepts a valid batch", () => {
    expect(validateProductAnalyticsBatch([validEvent])).toEqual({
      events: [
        {
          event: "pageView",
          category: "navigation",
          action: "pageView",
          label: "Releases",
          value: "/releases",
          page_path: "/releases",
        },
      ],
    });
  });

  it("rejects non-array payloads", () => {
    expect(validateProductAnalyticsBatch({ events: [validEvent] })).toEqual({
      error: "events must be an array",
    });
  });

  it("rejects empty batches", () => {
    expect(validateProductAnalyticsBatch([])).toEqual({
      error: "events must not be empty",
    });
  });

  it("rejects batches over the max size", () => {
    const events = Array.from(
      { length: PRODUCT_ANALYTICS_MAX_BATCH_SIZE + 1 },
      () => validEvent,
    );

    expect(validateProductAnalyticsBatch(events)).toEqual({
      error: `events must contain at most ${PRODUCT_ANALYTICS_MAX_BATCH_SIZE} items`,
    });
  });

  it("rejects missing required fields", () => {
    expect(
      validateProductAnalyticsBatch([
        {
          ...validEvent,
          label: "   ",
        },
      ]),
    ).toEqual({
      error: "label is required",
    });
  });

  it("rejects values that are too long", () => {
    expect(
      validateProductAnalyticsBatch([
        {
          ...validEvent,
          value: "a".repeat(201),
        },
      ]),
    ).toEqual({
      error: "value is too long",
    });
  });

  it("rejects non-object events", () => {
    expect(validateProductAnalyticsBatch(["not-an-object"])).toEqual({
      error: "each event must be an object",
    });
  });
});
