export const RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS = 400;

let lastGlobalHoverPrefetchAt = -RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS;

export const resetReleaseCrateMembershipHoverPrefetchForTests = (): void => {
  lastGlobalHoverPrefetchAt = -RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS;
};

export const shouldRunReleaseCrateMembershipHoverPrefetch = (): boolean => {
  const now = Date.now();
  if (
    now - lastGlobalHoverPrefetchAt <
    RELEASE_CRATE_MEMBERSHIP_HOVER_PREFETCH_MS
  ) {
    return false;
  }

  lastGlobalHoverPrefetchAt = now;
  return true;
};
