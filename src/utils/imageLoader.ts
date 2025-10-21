import { MOSAIC_CONSTANTS } from "src/constants/mosaic";

interface ImageLoadOptions {
  url: string;
  cellSize: number;
  imageQuality: number;
  imageFormat: "jpeg" | "png";
  timeout?: number;
}

interface ImageLoadResult {
  success: boolean;
  image?: HTMLImageElement;
  error?: string;
}

// Cache for loaded images to avoid re-downloading
const imageCache = new Map<string, HTMLImageElement>();

export function createOptimizedImageLoader() {
  return async ({
    url,
    cellSize,
    imageQuality,
    imageFormat,
    timeout = MOSAIC_CONSTANTS.IMAGE_LOAD_TIMEOUT,
  }: ImageLoadOptions): Promise<ImageLoadResult> => {
    // Create cache key based on URL and parameters
    const cacheKey = `${url}-${cellSize}-${imageQuality}-${imageFormat}`;

    // Check cache first
    const cachedImage = imageCache.get(cacheKey);
    if (cachedImage) {
      return { success: true, image: cachedImage };
    }

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
        // Cache the successful image
        imageCache.set(cacheKey, img);
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
