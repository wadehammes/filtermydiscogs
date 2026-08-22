export interface DiscogsRateLimitSnapshot {
  limit: number;
  used: number;
  remaining: number;
  recordedAt: number;
}

const RATE_LIMIT_WINDOW_MS = 60_000;

function parseHeaderInt(headers: Headers, name: string): number | null {
  const value = headers.get(name);
  if (!value) {
    return null;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

export function parseDiscogsRateLimitHeaders(
  headers: Headers,
): DiscogsRateLimitSnapshot | null {
  const limit = parseHeaderInt(headers, "X-Discogs-Ratelimit");
  const used = parseHeaderInt(headers, "X-Discogs-Ratelimit-Used");
  const remaining = parseHeaderInt(headers, "X-Discogs-Ratelimit-Remaining");

  if (limit === null || used === null || remaining === null) {
    return null;
  }

  return {
    limit,
    used,
    remaining,
    recordedAt: Date.now(),
  };
}

let lastSnapshot: DiscogsRateLimitSnapshot | null = null;

export function recordDiscogsRateLimitHeaders(headers: Headers): void {
  const snapshot = parseDiscogsRateLimitHeaders(headers);
  if (snapshot) {
    lastSnapshot = snapshot;
  }
}

export function getDiscogsRateLimitSnapshot(): DiscogsRateLimitSnapshot | null {
  return lastSnapshot;
}

export interface ComputeDiscogsRateLimitWaitMsParams {
  snapshot: DiscogsRateLimitSnapshot | null;
  lastRequestAt: number;
  now: number;
  fallbackIntervalMs: number;
}

export function computeDiscogsRateLimitWaitMs({
  snapshot,
  lastRequestAt,
  now,
  fallbackIntervalMs,
}: ComputeDiscogsRateLimitWaitMsParams): number {
  const elapsedSinceLastRequest = Math.max(0, now - lastRequestAt);

  if (!snapshot) {
    return Math.max(0, fallbackIntervalMs - elapsedSinceLastRequest);
  }

  const { limit, remaining, recordedAt } = snapshot;
  const sustainableMs = Math.ceil(RATE_LIMIT_WINDOW_MS / Math.max(1, limit));

  if (remaining <= 0) {
    return Math.max(0, RATE_LIMIT_WINDOW_MS - (now - recordedAt));
  }

  const headroomRatio = remaining / limit;

  if (headroomRatio > 0.5) {
    return Math.max(0, Math.floor(sustainableMs / 2) - elapsedSinceLastRequest);
  }

  if (headroomRatio > 0.1) {
    return Math.max(0, sustainableMs - elapsedSinceLastRequest);
  }

  return Math.max(0, Math.ceil(sustainableMs * 1.25) - elapsedSinceLastRequest);
}
