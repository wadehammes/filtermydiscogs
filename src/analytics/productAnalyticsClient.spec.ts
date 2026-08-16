import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import {
  flushProductAnalyticsEvents,
  queueProductAnalyticsEvent,
  resetProductAnalyticsQueueForTests,
} from "src/analytics/productAnalyticsClient";
import { PRODUCT_ANALYTICS_INGEST_PATH } from "src/types/productAnalytics.types";

describe("productAnalyticsClient", () => {
  beforeEach(() => {
    resetProductAnalyticsQueueForTests();
    jest.useFakeTimers();
    global.fetch = jest.fn() as typeof fetch;
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it("posts queued events after the flush delay", async () => {
    const mockFetch = jest
      .mocked(global.fetch)
      .mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    queueProductAnalyticsEvent({
      event: "pageView",
      category: "navigation",
      action: "pageView",
      label: "Releases",
      value: "/releases",
      page_path: "/releases",
    });

    expect(mockFetch).not.toHaveBeenCalled();

    jest.advanceTimersByTime(400);
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledWith(
      PRODUCT_ANALYTICS_INGEST_PATH,
      expect.objectContaining({
        method: "POST",
        keepalive: true,
        credentials: "same-origin",
      }),
    );
  });

  it("re-queues events when the ingest request fails", async () => {
    const mockFetch = jest
      .mocked(global.fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ error: "Failed" }), { status: 500 }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true }), { status: 200 }),
      );

    queueProductAnalyticsEvent({
      event: "pageView",
      category: "navigation",
      action: "pageView",
      label: "Dashboard",
      value: "/dashboard",
      page_path: "/dashboard",
    });

    flushProductAnalyticsEvents();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(400);

    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("drops events after three failed ingest attempts", async () => {
    const mockFetch = jest
      .mocked(global.fetch)
      .mockResolvedValue(
        new Response(JSON.stringify({ error: "Failed" }), { status: 500 }),
      );

    queueProductAnalyticsEvent({
      event: "pageView",
      category: "navigation",
      action: "pageView",
      label: "Releases",
      value: "/releases",
      page_path: "/releases",
    });

    flushProductAnalyticsEvents();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(1);

    await jest.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(2);

    await jest.advanceTimersByTimeAsync(400);
    await Promise.resolve();
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(3);

    await jest.advanceTimersByTimeAsync(400);
    await Promise.resolve();

    expect(mockFetch).toHaveBeenCalledTimes(3);
  });
});
