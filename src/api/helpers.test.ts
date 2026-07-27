import { beforeEach, describe, expect, it } from "@jest/globals";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  mockFetchError,
  mockFetchResponse,
  mockFetchSuccess,
  resetFetchMock,
} from "src/tests/mocks/mockFetchResponse";
import {
  addReleaseToCrate,
  checkAuth,
  clearAllPackedInCrate,
  clearData,
  createCrate,
  deleteCrate,
  fetchCrate,
  fetchCrates,
  fetchDiscogsCollection,
  fetchDiscogsRelease,
  fetchDiscogsSearch,
  logout,
  removeReleaseFromCrate,
  setReleasePackedInCrate,
  syncCrates,
  updateCrate,
} from "./helpers";

global.fetch = jest.fn();
const mockFetch = jest.mocked(fetch);

const wrapCrateReleases = (
  releases: ReturnType<typeof releaseFactory.buildList>,
) => releases.map((release) => ({ release, found_at: null }));

describe("fetchDiscogsCollection", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("fetches collection successfully", async () => {
    const mockCollection = collectionFactory.build();
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockCollection));

    const result = await fetchDiscogsCollection({
      username: "testuser",
      page: 1,
    });

    expect(result).toEqual(mockCollection);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/collection?page=1&per_page=100&sort=added&sort_order=desc&username=testuser",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
  });

  it("uses default page when not provided", async () => {
    const mockCollection = collectionFactory.build();
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockCollection));

    await fetchDiscogsCollection({ username: "testuser" });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringMatching(/page=1.*per_page=100/),
      expect.any(Object),
    );
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(500));

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow("HTTP error! status: 500");
  });

  it("uses API error message when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(
      mockFetchError(502, {
        error:
          "Discogs returned an error (their servers may be overloaded or temporarily down). Try again in a few minutes.",
      }),
    );

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow(
      "Discogs returned an error (their servers may be overloaded or temporarily down). Try again in a few minutes.",
    );
  });

  it("throws error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow("Network error");
  });

  it("throws generic error on non-Error rejection", async () => {
    mockFetch.mockRejectedValueOnce("String error");

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow("Failed to fetch collection");
  });
});

describe("fetchDiscogsRelease", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("fetches release successfully", async () => {
    const mockRelease = { id: "123", title: "Test Release" };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockRelease));

    const result = await fetchDiscogsRelease("123");

    expect(result).toEqual(mockRelease);
    expect(mockFetch).toHaveBeenCalledWith("/api/release/123", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(404));

    await expect(fetchDiscogsRelease("123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });

  it("throws error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchDiscogsRelease("123")).rejects.toThrow("Network error");
  });
});

describe("fetchDiscogsSearch", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("fetches search results successfully with all parameters", async () => {
    const mockSearch = {
      pagination: { pages: 1, items: 10 },
      results: [],
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockSearch));

    const result = await fetchDiscogsSearch(
      "test query",
      2,
      50,
      "release",
      "LP",
      "2020",
      "Rock",
      "Electronic",
    );

    expect(result).toEqual(mockSearch);
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("q=test+query"),
      expect.objectContaining({
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("uses default parameters when not provided", async () => {
    const mockSearch = {
      pagination: { pages: 1, items: 10 },
      results: [],
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockSearch));

    await fetchDiscogsSearch("test");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=1&per_page=100&type=release"),
      expect.any(Object),
    );
  });

  it("includes optional parameters when provided", async () => {
    const mockSearch = {
      pagination: { pages: 1, items: 10 },
      results: [],
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockSearch));

    await fetchDiscogsSearch(
      "test",
      1,
      100,
      "release",
      "LP",
      "2020",
      "Rock",
      "Shoegaze",
    );

    const callUrl = mockFetch.mock.calls[0]?.[0] as string;
    expect(callUrl).toBeDefined();
    expect(callUrl).toContain("format=LP");
    expect(callUrl).toContain("year=2020");
    expect(callUrl).toContain("genre=Rock");
    expect(callUrl).toContain("style=Shoegaze");
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(400));

    await expect(fetchDiscogsSearch("test")).rejects.toThrow(
      "HTTP error! status: 400",
    );
  });
});

describe("fetchCrates", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("fetches crates successfully", async () => {
    const mockCrates = {
      data: crateFactory.buildList(3),
      pagination: {
        page: 1,
        pageSize: 100,
        total: 3,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockCrates));

    const result = await fetchCrates();

    expect(result).toEqual({ crates: mockCrates.data });
    expect(mockFetch).toHaveBeenCalledWith("/api/crates?page=1&pageSize=100", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(401));

    await expect(fetchCrates()).rejects.toThrow("HTTP error! status: 401");
  });
});

describe("fetchCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("fetches crate successfully", async () => {
    const crateId = "crate-123";
    const mockCrate = {
      crate: crateFactory.build({ id: crateId }),
      releases: wrapCrateReleases(releaseFactory.buildList(5)),
      pagination: {
        page: 1,
        pageSize: 100,
        total: 5,
        totalPages: 1,
        hasNextPage: false,
        hasPreviousPage: false,
      },
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockCrate));

    const result = await fetchCrate(crateId);

    expect(result).toEqual(mockCrate);
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/crates/${crateId}?page=1&pageSize=100`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );
  });

  it("fetches all crate pages when paginated", async () => {
    const crateId = "crate-123";
    const crate = crateFactory.build({ id: crateId });

    mockFetch
      .mockResolvedValueOnce(
        mockFetchSuccess({
          crate,
          releases: wrapCrateReleases(releaseFactory.buildList(2)),
          pagination: {
            page: 1,
            pageSize: 2,
            total: 3,
            totalPages: 2,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        }),
      )
      .mockResolvedValueOnce(
        mockFetchSuccess({
          crate,
          releases: wrapCrateReleases(releaseFactory.buildList(1)),
          pagination: {
            page: 2,
            pageSize: 2,
            total: 3,
            totalPages: 2,
            hasNextPage: false,
            hasPreviousPage: true,
          },
        }),
      );

    const result = await fetchCrate(crateId);

    expect(result.releases).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(2);
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(404));

    await expect(fetchCrate("crate-123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("createCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("creates crate successfully", async () => {
    const crateName = "My New Crate";
    const mockCrate = crateFactory.build({ name: crateName });
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ crate: mockCrate }));

    const result = await createCrate(crateName);

    expect(result.crate).toEqual(mockCrate);
    expect(mockFetch).toHaveBeenCalledWith("/api/crates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name: crateName }),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(400));

    await expect(createCrate("Test")).rejects.toThrow(
      "HTTP error! status: 400",
    );
  });
});

describe("updateCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("updates crate successfully with name", async () => {
    const crateId = "crate-123";
    const updates = { name: "Updated Name" };
    const mockCrate = crateFactory.build({ id: crateId, name: updates.name });
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ crate: mockCrate }));

    const result = await updateCrate(crateId, updates);

    expect(result.crate).toEqual(mockCrate);
    expect(mockFetch).toHaveBeenCalledWith(`/api/crates/${crateId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(updates),
    });
  });

  it("updates crate successfully with is_default", async () => {
    const crateId = "crate-123";
    const updates = { is_default: true };
    const mockCrate = crateFactory.build({ id: crateId, is_default: true });
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ crate: mockCrate }));

    const result = await updateCrate(crateId, updates);

    expect(result.crate).toEqual(mockCrate);
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/crates/${crateId}`,
      expect.objectContaining({
        body: JSON.stringify(updates),
      }),
    );
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(
      mockFetchResponse(undefined, {
        ok: false,
        status: 404,
      }),
    );

    await expect(updateCrate("crate-123", { name: "Test" })).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("deleteCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("deletes crate successfully", async () => {
    const crateId = "crate-123";
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(undefined));

    await deleteCrate(crateId);

    expect(mockFetch).toHaveBeenCalledWith(`/api/crates/${crateId}`, {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(404));

    await expect(deleteCrate("crate-123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("addReleaseToCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("adds release to crate successfully", async () => {
    const crateId = "crate-123";
    const release = releaseFactory.build();
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));

    const result = await addReleaseToCrate(crateId, release);

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(`/api/crates/${crateId}/releases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(release),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(400));

    await expect(
      addReleaseToCrate("crate-123", releaseFactory.build()),
    ).rejects.toThrow("HTTP error! status: 400");
  });
});

describe("removeReleaseFromCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("removes release from crate successfully", async () => {
    const crateId = "crate-123";
    const releaseId = "release-456";
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));

    const result = await removeReleaseFromCrate(crateId, releaseId);

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/crates/${crateId}/releases/${releaseId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(404));

    await expect(
      removeReleaseFromCrate("crate-123", "release-456"),
    ).rejects.toThrow("HTTP error! status: 404");
  });
});

describe("setReleasePackedInCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("updates packed status successfully", async () => {
    const crateId = "crate-123";
    const releaseId = "release-456";
    mockFetch.mockResolvedValueOnce(
      mockFetchSuccess({
        success: true,
        found_at: "2026-07-27T00:00:00.000Z",
      }),
    );

    const result = await setReleasePackedInCrate(crateId, releaseId, true);

    expect(result).toEqual({
      success: true,
      found_at: "2026-07-27T00:00:00.000Z",
    });
    expect(mockFetch).toHaveBeenCalledWith(
      `/api/crates/${crateId}/releases/${releaseId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ found: true }),
      },
    );
  });
});

describe("clearAllPackedInCrate", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("clears packed status successfully", async () => {
    const crateId = "crate-123";
    mockFetch.mockResolvedValueOnce(
      mockFetchSuccess({
        success: true,
        cleared_count: 2,
      }),
    );

    const result = await clearAllPackedInCrate(crateId);

    expect(result).toEqual({
      success: true,
      cleared_count: 2,
    });
    expect(mockFetch).toHaveBeenCalledWith(`/api/crates/${crateId}/releases`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clear_found: true }),
    });
  });
});

describe("syncCrates", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("syncs crates successfully", async () => {
    const collectionInstanceIds = ["id1", "id2", "id3"];
    const mockResponse = { success: true, removedCount: 2 };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockResponse));

    const result = await syncCrates(collectionInstanceIds);

    expect(result).toEqual(mockResponse);
    expect(mockFetch).toHaveBeenCalledWith("/api/crates/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ collectionInstanceIds }),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(500));

    await expect(syncCrates(["id1"])).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});

describe("checkAuth", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("returns auth status when authenticated", async () => {
    const mockAuth = {
      isAuthenticated: true,
      username: "testuser",
      userId: "123456",
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockAuth));

    const result = await checkAuth();

    expect(result).toEqual(mockAuth);
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/check", {
      method: "GET",
      credentials: "include",
    });
  });

  it("returns auth status when not authenticated", async () => {
    const mockAuth = {
      isAuthenticated: false,
      username: null,
      userId: null,
    };
    mockFetch.mockResolvedValueOnce(mockFetchSuccess(mockAuth));

    const result = await checkAuth();

    expect(result).toEqual(mockAuth);
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(500));

    await expect(checkAuth()).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("clearData", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("clears data successfully", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));

    const result = await clearData();

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/clear-data", {
      method: "POST",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(500));

    await expect(clearData()).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("logout", () => {
  beforeEach(() => {
    resetFetchMock();
  });

  it("logs out successfully", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchSuccess({ success: true }));

    const result = await logout();

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce(mockFetchError(500));

    await expect(logout()).rejects.toThrow("HTTP error! status: 500");
  });
});
