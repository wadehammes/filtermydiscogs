import { RELEASE_CARD_COVER_BLUR_SESSION_KEY } from "src/constants/storageKeys";

export type ReleaseCardCoverBlurTier = "always" | "hover-only";

export const RELEASE_CARD_COVER_BLUR_ATTR = "data-release-card-cover-blur";

export const RELEASE_CARD_COVER_BLUR_BENCHMARK_BUDGET_MS = 10;

const BENCHMARK_CANVAS_PX = 160;
const BENCHMARK_BLUR_PX = 24;

const isCachedTier = (
  value: string | null,
): value is ReleaseCardCoverBlurTier =>
  value === "always" || value === "hover-only";

export const measureReleaseCardCoverBlurTier = (): ReleaseCardCoverBlurTier => {
  if (typeof window === "undefined") {
    return "hover-only";
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    return "hover-only";
  }

  if (window.matchMedia("(update: slow)").matches) {
    return "hover-only";
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = BENCHMARK_CANVAS_PX;
    canvas.height = BENCHMARK_CANVAS_PX;
    const context = canvas.getContext("2d");
    if (!context) {
      return "hover-only";
    }

    context.fillStyle = "#808080";
    context.fillRect(0, 0, BENCHMARK_CANVAS_PX, BENCHMARK_CANVAS_PX);
    context.fillStyle = "#404040";
    context.fillRect(24, 24, 112, 112);

    const startedAt = performance.now();
    context.filter = `blur(${BENCHMARK_BLUR_PX}px)`;
    context.drawImage(canvas, 0, 0);
    context.filter = "none";
    const elapsedMs = performance.now() - startedAt;

    return elapsedMs <= RELEASE_CARD_COVER_BLUR_BENCHMARK_BUDGET_MS
      ? "always"
      : "hover-only";
  } catch {
    return "hover-only";
  }
};

export const applyReleaseCardCoverBlurTierToDocument = (
  tier: ReleaseCardCoverBlurTier,
): void => {
  if (typeof document === "undefined") {
    return;
  }

  if (
    document.documentElement.getAttribute(RELEASE_CARD_COVER_BLUR_ATTR) === tier
  ) {
    return;
  }

  document.documentElement.setAttribute(RELEASE_CARD_COVER_BLUR_ATTR, tier);
};

export const readCachedReleaseCardCoverBlurTier =
  (): ReleaseCardCoverBlurTier | null => {
    if (typeof window === "undefined") {
      return null;
    }

    try {
      const cached = sessionStorage.getItem(
        RELEASE_CARD_COVER_BLUR_SESSION_KEY,
      );
      return isCachedTier(cached) ? cached : null;
    } catch {
      return null;
    }
  };

export const measureAndCacheReleaseCardCoverBlurTier =
  (): ReleaseCardCoverBlurTier => {
    const tier = measureReleaseCardCoverBlurTier();

    try {
      sessionStorage.setItem(RELEASE_CARD_COVER_BLUR_SESSION_KEY, tier);
    } catch {
      return tier;
    }

    return tier;
  };

export const resolveReleaseCardCoverBlurTier = (): ReleaseCardCoverBlurTier => {
  return (
    readCachedReleaseCardCoverBlurTier() ??
    measureAndCacheReleaseCardCoverBlurTier()
  );
};

export const scheduleReleaseCardCoverBlurTierMeasure = (
  onTier: (tier: ReleaseCardCoverBlurTier) => void,
): (() => void) => {
  const run = () => {
    onTier(measureAndCacheReleaseCardCoverBlurTier());
  };

  if (typeof window.requestIdleCallback === "function") {
    const idleId = window.requestIdleCallback(run, { timeout: 2000 });
    return () => {
      window.cancelIdleCallback(idleId);
    };
  }

  const timeoutId = window.setTimeout(run, 0);
  return () => {
    window.clearTimeout(timeoutId);
  };
};
