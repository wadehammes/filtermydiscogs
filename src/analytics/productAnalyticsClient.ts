import type { ProductAnalyticsEventInput } from "src/types/productAnalytics.types";
import {
  PRODUCT_ANALYTICS_INGEST_PATH,
  PRODUCT_ANALYTICS_MAX_BATCH_SIZE,
} from "src/types/productAnalytics.types";
import { isBrowser } from "src/utils/helpers";

const FLUSH_DELAY_MS = 400;
export const PRODUCT_ANALYTICS_MAX_FLUSH_ATTEMPTS = 3;

let eventQueue: ProductAnalyticsEventInput[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let lifecycleListenersRegistered = false;
let consecutiveFlushFailures = 0;

const registerLifecycleFlushListeners = () => {
  if (!isBrowser() || lifecycleListenersRegistered) {
    return;
  }

  lifecycleListenersRegistered = true;

  window.addEventListener("pagehide", () => {
    flushProductAnalyticsEvents();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushProductAnalyticsEvents();
    }
  });
};

const postProductAnalyticsEvents = async (
  events: ProductAnalyticsEventInput[],
): Promise<boolean> => {
  const payload = JSON.stringify({ events });

  try {
    const response = await fetch(PRODUCT_ANALYTICS_INGEST_PATH, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
      credentials: "same-origin",
    });

    return response.ok;
  } catch {
    return false;
  }
};

export const flushProductAnalyticsEvents = () => {
  if (!isBrowser() || eventQueue.length === 0) {
    return;
  }

  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  const events = eventQueue.splice(0, PRODUCT_ANALYTICS_MAX_BATCH_SIZE);

  void postProductAnalyticsEvents(events).then((ok) => {
    if (!ok) {
      consecutiveFlushFailures += 1;

      if (consecutiveFlushFailures >= PRODUCT_ANALYTICS_MAX_FLUSH_ATTEMPTS) {
        consecutiveFlushFailures = 0;

        if (flushTimer !== null) {
          clearTimeout(flushTimer);
          flushTimer = null;
        }

        if (eventQueue.length > 0) {
          scheduleProductAnalyticsFlush();
        }

        return;
      }

      eventQueue.unshift(...events);
      scheduleProductAnalyticsFlush();
      return;
    }

    consecutiveFlushFailures = 0;

    if (eventQueue.length > 0) {
      scheduleProductAnalyticsFlush();
    }
  });
};

export const scheduleProductAnalyticsFlush = () => {
  if (!isBrowser()) {
    return;
  }

  registerLifecycleFlushListeners();

  if (flushTimer !== null) {
    return;
  }

  flushTimer = setTimeout(() => {
    flushTimer = null;
    flushProductAnalyticsEvents();
  }, FLUSH_DELAY_MS);
};

export const queueProductAnalyticsEvent = (
  event: ProductAnalyticsEventInput,
) => {
  if (!isBrowser()) {
    return;
  }

  registerLifecycleFlushListeners();

  eventQueue.push({
    ...event,
    page_path: event.page_path ?? window.location.pathname,
  });

  if (eventQueue.length >= PRODUCT_ANALYTICS_MAX_BATCH_SIZE) {
    flushProductAnalyticsEvents();
    return;
  }

  scheduleProductAnalyticsFlush();
};

export const resetProductAnalyticsQueueForTests = () => {
  eventQueue = [];
  consecutiveFlushFailures = 0;

  if (flushTimer !== null) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }

  lifecycleListenersRegistered = false;
};
