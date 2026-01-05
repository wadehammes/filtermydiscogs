/**
 * API path constants for testing
 */
export const API_PATHS = {
  crates: {
    list: "/api/crates",
    create: "/api/crates",
    get: (id: string) => `/api/crates/${id}`,
    update: (id: string) => `/api/crates/${id}`,
    delete: (id: string) => `/api/crates/${id}`,
    addRelease: (id: string) => `/api/crates/${id}/releases`,
    removeRelease: (id: string, releaseId: string) =>
      `/api/crates/${id}/releases/${releaseId}`,
    sync: "/api/crates/sync",
  },
} as const;
