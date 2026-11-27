import { describe, expect, it } from "@jest/globals";
import {
  formatCollectionLastSyncedLabel,
  formatCollectionSyncingLabel,
  resolveCollectionLastSyncedLabel,
} from "src/utils/formatCollectionLastSyncedLabel";

describe("formatCollectionLastSyncedLabel", () => {
  const now = Date.parse("2024-06-15T12:00:00.000Z");

  it("when synced under a minute ago, returns just now copy", () => {
    expect(
      formatCollectionLastSyncedLabel(
        Date.parse("2024-06-15T11:59:30.000Z"),
        now,
      ),
    ).toBe("Collection synced just now");
  });

  it("when synced minutes ago, returns minute copy", () => {
    expect(
      formatCollectionLastSyncedLabel(
        Date.parse("2024-06-15T11:55:00.000Z"),
        now,
      ),
    ).toBe("Collection synced 5 minutes ago");
  });

  it("when synced hours ago, returns hour copy", () => {
    expect(
      formatCollectionLastSyncedLabel(
        Date.parse("2024-06-15T08:00:00.000Z"),
        now,
      ),
    ).toBe("Collection synced 4 hours ago");
  });

  it("when synced over a day ago, returns calendar date copy", () => {
    expect(
      formatCollectionLastSyncedLabel(
        Date.parse("2024-06-10T12:00:00.000Z"),
        now,
      ),
    ).toBe("Collection synced on Jun 10, 2024");
  });
});

describe("resolveCollectionLastSyncedLabel", () => {
  it("when fetching, returns syncing label", () => {
    expect(
      resolveCollectionLastSyncedLabel({
        fetchingCollection: true,
        dataUpdatedAt: 1,
      }),
    ).toBe("Syncing collection with Discogs…");
  });

  it("when idle without timestamp, returns null", () => {
    expect(
      resolveCollectionLastSyncedLabel({
        fetchingCollection: false,
        dataUpdatedAt: null,
      }),
    ).toBeNull();
  });
});

describe("formatCollectionSyncingLabel", () => {
  it("returns syncing copy", () => {
    expect(formatCollectionSyncingLabel()).toBe(
      "Syncing collection with Discogs…",
    );
  });
});
