import type { AuthStatus } from "src/services/auth.service";

const AUTH_RATE_LIMIT_REFETCH_MS = 60_000;
const AUTH_OUTAGE_REFETCH_MS = 120_000;

export const authCheckRefetchIntervalMs = (
  data: AuthStatus | undefined,
): number | false => {
  if (!(data?.rateLimited || data?.discogsUnavailable)) {
    return false;
  }

  if (data.discogsUnavailable) {
    return AUTH_OUTAGE_REFETCH_MS;
  }

  return AUTH_RATE_LIMIT_REFETCH_MS;
};

export const authCheckRefetchOnWindowFocus = (
  data: AuthStatus | undefined,
): boolean => data?.rateLimited === true && data?.discogsUnavailable !== true;
