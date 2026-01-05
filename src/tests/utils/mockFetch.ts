import { API_PATHS } from "./apiPaths";

/**
 * Helper to create a mock fetch response
 */
export const createMockFetchResponse = <T>(data: T, ok = true) => ({
  ok,
  json: async () => data,
  status: ok ? 200 : 400,
  statusText: ok ? "OK" : "Bad Request",
});

/**
 * Setup fetch mocks for crate API endpoints
 */
export const setupCrateFetchMocks = (mocks: {
  listCrates?: { crates: unknown[] };
  getCrate?: (id: string) => { crate: unknown; releases: unknown[] };
  createCrate?: { crate: unknown };
  addRelease?: { success: boolean };
  removeRelease?: { success: boolean };
  updateCrate?: (id: string) => { crate: unknown };
  deleteCrate?: { success: boolean };
}) => {
  const fetchMock = jest.mocked(global.fetch);

  fetchMock.mockImplementation(
    (input: string | URL | Request, options?: RequestInit) => {
      const urlString =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : input.url;

      // GET /api/crates
      if (urlString === API_PATHS.crates.list) {
        if (mocks.listCrates) {
          return Promise.resolve(
            createMockFetchResponse(mocks.listCrates) as Response,
          );
        }
      }

      // GET /api/crates/[id]
      if (urlString.startsWith(API_PATHS.crates.get(""))) {
        const crateId = urlString.split("/").pop() || "";
        if (mocks.getCrate) {
          return Promise.resolve(
            createMockFetchResponse(mocks.getCrate(crateId)) as Response,
          );
        }
      }

      // POST /api/crates
      if (urlString === API_PATHS.crates.create && options?.method === "POST") {
        if (mocks.createCrate) {
          return Promise.resolve(
            createMockFetchResponse(mocks.createCrate) as Response,
          );
        }
      }

      // POST /api/crates/[id]/releases
      if (
        options?.method === "POST" &&
        urlString.includes("/releases") &&
        !urlString.includes("/releases/")
      ) {
        if (mocks.addRelease) {
          return Promise.resolve(
            createMockFetchResponse(mocks.addRelease) as Response,
          );
        }
      }

      // DELETE /api/crates/[id]/releases/[releaseId]
      if (options?.method === "DELETE" && urlString.includes("/releases/")) {
        if (mocks.removeRelease) {
          return Promise.resolve(
            createMockFetchResponse(mocks.removeRelease) as Response,
          );
        }
      }

      // PUT /api/crates/[id]
      if (
        options?.method === "PUT" &&
        urlString.startsWith(API_PATHS.crates.update(""))
      ) {
        const crateId = urlString.split("/").pop() || "";
        if (mocks.updateCrate) {
          return Promise.resolve(
            createMockFetchResponse(mocks.updateCrate(crateId)) as Response,
          );
        }
      }

      // DELETE /api/crates/[id]
      if (
        options?.method === "DELETE" &&
        urlString.startsWith(API_PATHS.crates.delete("")) &&
        !urlString.includes("/releases/")
      ) {
        if (mocks.deleteCrate) {
          return Promise.resolve(
            createMockFetchResponse(mocks.deleteCrate) as Response,
          );
        }
      }

      return Promise.reject(new Error(`Unexpected fetch call: ${urlString}`));
    },
  );
};
