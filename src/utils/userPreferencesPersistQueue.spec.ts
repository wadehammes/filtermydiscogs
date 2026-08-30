import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  persistedFiltersFactory,
  userPreferencesFactory,
} from "src/tests/factories/UserPreferences.factory";
import type { UserPreferencesPatch } from "src/types/userPreferences.types";
import {
  flushUserPreferencesPersist,
  type PersistPreferencesOptions,
  resetUserPreferencesPersistQueue,
  scheduleUserPreferencesPersist,
} from "./userPreferencesPersistQueue";

describe("userPreferencesPersistQueue", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    resetUserPreferencesPersistQueue();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("debounces filters-only patches", () => {
    const mutate = jest.fn();
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });

    scheduleUserPreferencesPersist({ filters }, mutate);
    expect(mutate).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      { filters },
      expect.objectContaining({}),
    );
  });

  it("flushes filters immediately when a non-filter field is queued", () => {
    const mutate = jest.fn();
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });

    scheduleUserPreferencesPersist({ filters }, mutate);
    scheduleUserPreferencesPersist({ theme: "dark" }, mutate);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate).toHaveBeenCalledWith(
      { filters, theme: "dark" },
      expect.objectContaining({}),
    );
  });

  it("skips redundant filters-only patches", () => {
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });
    const mutate = jest.fn(
      (patch: UserPreferencesPatch, options?: PersistPreferencesOptions) => {
        options?.onSuccess?.({
          preferences: userPreferencesFactory.build({
            filters: patch.filters ?? filters,
          }),
        });
        options?.onSettled?.();
      },
    );

    scheduleUserPreferencesPersist({ filters }, mutate);
    jest.advanceTimersByTime(400);
    mutate.mockClear();

    scheduleUserPreferencesPersist({ filters }, mutate);
    jest.advanceTimersByTime(400);

    expect(mutate).not.toHaveBeenCalled();
  });

  it("flushes analytics consent immediately without debouncing", () => {
    const mutate = jest.fn();

    scheduleUserPreferencesPersist({ analyticsConsent: true }, mutate);

    expect(mutate).toHaveBeenCalledWith(
      { analyticsConsent: true },
      expect.objectContaining({}),
    );
  });

  it("flushes showDjMetadataOnTracks immediately without debouncing", () => {
    const mutate = jest.fn();

    scheduleUserPreferencesPersist({ showDjMetadataOnTracks: true }, mutate);

    expect(mutate).toHaveBeenCalledWith(
      { showDjMetadataOnTracks: true },
      expect.objectContaining({}),
    );
  });

  it("flushes autoPlayOnQueueAdd immediately without debouncing", () => {
    const mutate = jest.fn();

    scheduleUserPreferencesPersist({ autoPlayOnQueueAdd: false }, mutate);

    expect(mutate).toHaveBeenCalledWith(
      { autoPlayOnQueueAdd: false },
      expect.objectContaining({}),
    );
  });

  it("flushUserPreferencesPersist sends pending filters", () => {
    const mutate = jest.fn();
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Jazz"],
    });

    scheduleUserPreferencesPersist({ filters }, mutate);
    flushUserPreferencesPersist(mutate);

    expect(mutate).toHaveBeenCalledWith(
      { filters },
      expect.objectContaining({}),
    );
  });

  it("resetUserPreferencesPersistQueue clears pending debounced work", () => {
    const mutate = jest.fn();
    const filters = persistedFiltersFactory.build({
      selectedStyles: ["Rock"],
    });

    scheduleUserPreferencesPersist({ filters }, mutate);
    resetUserPreferencesPersistQueue();
    jest.advanceTimersByTime(400);

    expect(mutate).not.toHaveBeenCalled();
  });
});
