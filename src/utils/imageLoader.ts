import { MOSAIC_CONSTANTS } from "src/constants/mosaic";

interface ImageLoadOptions {
  url: string;
  cellSize: number;
  imageQuality: number;
  imageFormat: "jpeg" | "png";
  timeout?: number;
  maxRetries?: number;
  retryDelay?: number;
}

interface ImageLoadResult {
  success: boolean;
  image?: HTMLImageElement;
  error?: string;
  retryCount?: number;
}

// Cache for loaded images to avoid re-downloading
const imageCache = new Map<string, HTMLImageElement>();

// Circuit breaker state
interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  isOpen: boolean;
}

const circuitBreaker = {
  state: {
    failures: 0,
    lastFailureTime: 0,
    isOpen: false,
  } as CircuitBreakerState,
  threshold: 5, // Open circuit after 5 consecutive failures
  timeout: 30000, // 30 seconds before trying again
  resetTimeout: 60000, // 1 minute to reset failure count
};

// Cache management
const CACHE_SIZE_LIMIT = 100; // Maximum number of cached images
const _CACHE_MEMORY_LIMIT = 50 * 1024 * 1024; // 50MB memory limit (approximate)

// Circuit breaker functions
function isCircuitOpen(): boolean {
  const now = Date.now();
  const { state, threshold, timeout, resetTimeout } = circuitBreaker;

  // Reset failure count if enough time has passed
  if (now - state.lastFailureTime > resetTimeout) {
    state.failures = 0;
    state.isOpen = false;
  }

  if (state.failures >= threshold) {
    state.isOpen = true;
    state.lastFailureTime = now;
  }

  if (state.isOpen && now - state.lastFailureTime > timeout) {
    state.isOpen = false;
  }

  return state.isOpen;
}

function recordSuccess(): void {
  circuitBreaker.state.failures = 0;
  circuitBreaker.state.isOpen = false;
}

function recordFailure(): void {
  circuitBreaker.state.failures++;
  circuitBreaker.state.lastFailureTime = Date.now();
}

function manageCacheSize(): void {
  if (imageCache.size > CACHE_SIZE_LIMIT) {
    const entries = Array.from(imageCache.entries());
    const toRemove = entries.slice(0, imageCache.size - CACHE_SIZE_LIMIT);
    toRemove.forEach(([key]) => {
      imageCache.delete(key);
    });
  }
}

function validateImageUrl(url: string): boolean {
  try {
    const parsedUrl = new URL(url);
    return ["http:", "https:"].includes(parsedUrl.protocol);
  } catch {
    return false;
  }
}

// Retry mechanism with exponential backoff
async function loadImageWithRetry(
  url: string,
  cellSize: number,
  imageQuality: number,
  imageFormat: "jpeg" | "png",
  timeout: number,
  maxRetries: number = 3,
  retryDelay: number = 1000,
): Promise<ImageLoadResult> {
  let lastError: string = "";

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await loadSingleImage(
        url,
        cellSize,
        imageQuality,
        imageFormat,
        timeout,
      );

      if (result.success) {
        recordSuccess();
        return { ...result, retryCount: attempt };
      }

      lastError = result.error || "Unknown error";

      // Don't retry on the last attempt
      if (attempt < maxRetries) {
        const delay = retryDelay * 2 ** attempt; // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    } catch (error) {
      lastError = error instanceof Error ? error.message : "Unknown error";

      if (attempt < maxRetries) {
        const delay = retryDelay * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  recordFailure();
  return {
    success: false,
    error: `Failed after ${maxRetries + 1} attempts: ${lastError}`,
    retryCount: maxRetries,
  };
}

// Single image load function
function loadSingleImage(
  url: string,
  cellSize: number,
  imageQuality: number,
  imageFormat: "jpeg" | "png",
  timeout: number,
): Promise<ImageLoadResult> {
  return new Promise((resolve) => {
    const img = new Image();

    const timeoutId = setTimeout(() => {
      resolve({
        success: false,
        error: `Timeout loading image after ${timeout}ms`,
      });
    }, timeout);

    img.onload = () => {
      clearTimeout(timeoutId);
      resolve({ success: true, image: img });
    };

    img.onerror = (error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        error: `Failed to load image: ${error}`,
      });
    };

    // Use optimized proxy URL
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(url)}&w=${cellSize}&h=${cellSize}&q=${imageQuality}&f=${imageFormat}`;
    img.crossOrigin = "anonymous";
    img.src = proxyUrl;
  });
}

export function createOptimizedImageLoader() {
  return async ({
    url,
    cellSize,
    imageQuality,
    imageFormat,
    timeout = MOSAIC_CONSTANTS.IMAGE_LOAD_TIMEOUT,
    maxRetries = 3,
    retryDelay = 1000,
  }: ImageLoadOptions): Promise<ImageLoadResult> => {
    // Validate URL
    if (!validateImageUrl(url)) {
      return {
        success: false,
        error: "Invalid image URL",
      };
    }

    // Check circuit breaker
    if (isCircuitOpen()) {
      return {
        success: false,
        error: "Image loading temporarily disabled due to high failure rate",
      };
    }

    // Create cache key based on URL and parameters
    const cacheKey = `${url}-${cellSize}-${imageQuality}-${imageFormat}`;

    // Check cache first
    const cachedImage = imageCache.get(cacheKey);
    if (cachedImage) {
      return { success: true, image: cachedImage };
    }

    // Load image with retry mechanism
    const result = await loadImageWithRetry(
      url,
      cellSize,
      imageQuality,
      imageFormat,
      timeout,
      maxRetries,
      retryDelay,
    );

    // Cache successful images
    if (result.success && result.image) {
      manageCacheSize();
      imageCache.set(cacheKey, result.image);
    }

    return result;
  };
}

// Utility to clear cache when needed
export function clearImageCache(): void {
  imageCache.clear();
}

// Utility to get cache size for debugging
export function getImageCacheSize(): number {
  return imageCache.size;
}

// Utility to get circuit breaker status
export function getCircuitBreakerStatus(): {
  isOpen: boolean;
  failures: number;
  lastFailureTime: number;
} {
  return {
    isOpen: circuitBreaker.state.isOpen,
    failures: circuitBreaker.state.failures,
    lastFailureTime: circuitBreaker.state.lastFailureTime,
  };
}

// Utility to reset circuit breaker
export function resetCircuitBreaker(): void {
  circuitBreaker.state.failures = 0;
  circuitBreaker.state.isOpen = false;
  circuitBreaker.state.lastFailureTime = 0;
}

// Utility to estimate cache memory usage (approximate)
export function getCacheMemoryUsage(): number {
  // Rough estimation: assume each image is ~50KB on average
  return imageCache.size * 50 * 1024;
}

// Utility to force cache cleanup
export function forceCacheCleanup(): void {
  if (imageCache.size > CACHE_SIZE_LIMIT) {
    const entries = Array.from(imageCache.entries());
    const toKeep = entries.slice(-CACHE_SIZE_LIMIT);
    imageCache.clear();
    toKeep.forEach(([key, value]) => {
      imageCache.set(key, value);
    });
  }
}
