import { mocked } from "jest-mock";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  addReleaseToCrate,
  checkAuth,
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
  syncCrates,
  updateCrate,
} from "./helpers";

global.fetch = jest.fn();
const mockFetch = mocked(fetch);

describe("fetchDiscogsCollection", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("fetches collection successfully", async () => {
    const mockCollection = collectionFactory.build();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCollection,
    } as Response);

    const result = await fetchDiscogsCollection("testuser", 1);

    expect(result).toEqual(mockCollection);
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/collection?username=testuser&page=1&sort=added&sort_order=desc",
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  });

  it("uses default page when not provided", async () => {
    const mockCollection = collectionFactory.build();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCollection,
    } as Response);

    await fetchDiscogsCollection("testuser");

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("page=1"),
      expect.any(Object),
    );
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(fetchDiscogsCollection("testuser")).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });

  it("throws error on network failure", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"));

    await expect(fetchDiscogsCollection("testuser")).rejects.toThrow(
      "Network error",
    );
  });

  it("throws generic error on non-Error rejection", async () => {
    mockFetch.mockRejectedValueOnce("String error");

    await expect(fetchDiscogsCollection("testuser")).rejects.toThrow(
      "Failed to fetch collection",
    );
  });
});

describe("fetchDiscogsRelease", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("fetches release successfully", async () => {
    const mockRelease = { id: "123", title: "Test Release" };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRelease,
    } as Response);

    const result = await fetchDiscogsRelease("123");

    expect(result).toEqual(mockRelease);
    expect(mockFetch).toHaveBeenCalledWith("/api/release/123", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

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
    mockFetch.mockClear();
  });

  it("fetches search results successfully with all parameters", async () => {
    const mockSearch = {
      pagination: { pages: 1, items: 10 },
      results: [],
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearch,
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearch,
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockSearch,
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    await expect(fetchDiscogsSearch("test")).rejects.toThrow(
      "HTTP error! status: 400",
    );
  });
});

describe("fetchCrates", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("fetches crates successfully", async () => {
    const mockCrates = {
      crates: crateFactory.buildList(3),
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrates,
    } as Response);

    const result = await fetchCrates();

    expect(result).toEqual(mockCrates);
    expect(mockFetch).toHaveBeenCalledWith("/api/crates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
    } as Response);

    await expect(fetchCrates()).rejects.toThrow("HTTP error! status: 401");
  });
});

describe("fetchCrate", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("fetches crate successfully", async () => {
    const crateId = "crate-123";
    const mockCrate = {
      crate: crateFactory.build({ id: crateId }),
      releases: releaseFactory.buildList(5),
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockCrate,
    } as Response);

    const result = await fetchCrate(crateId);

    expect(result).toEqual(mockCrate);
    expect(mockFetch).toHaveBeenCalledWith(`/api/crates/${crateId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(fetchCrate("crate-123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("createCrate", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("creates crate successfully", async () => {
    const crateName = "My New Crate";
    const mockCrate = crateFactory.build({ name: crateName });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ crate: mockCrate }),
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    await expect(createCrate("Test")).rejects.toThrow(
      "HTTP error! status: 400",
    );
  });
});

describe("updateCrate", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("updates crate successfully with name", async () => {
    const crateId = "crate-123";
    const updates = { name: "Updated Name" };
    const mockCrate = crateFactory.build({ id: crateId, name: updates.name });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ crate: mockCrate }),
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ crate: mockCrate }),
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: jest.fn().mockRejectedValue(new Error("Invalid JSON")),
    } as unknown as Response);

    await expect(updateCrate("crate-123", { name: "Test" })).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("deleteCrate", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("deletes crate successfully", async () => {
    const crateId = "crate-123";
    mockFetch.mockResolvedValueOnce({
      ok: true,
    } as Response);

    await deleteCrate(crateId);

    expect(mockFetch).toHaveBeenCalledWith(`/api/crates/${crateId}`, {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(deleteCrate("crate-123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("addReleaseToCrate", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("adds release to crate successfully", async () => {
    const crateId = "crate-123";
    const release = releaseFactory.build();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
    } as Response);

    await expect(
      addReleaseToCrate("crate-123", releaseFactory.build()),
    ).rejects.toThrow("HTTP error! status: 400");
  });
});

describe("removeReleaseFromCrate", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("removes release from crate successfully", async () => {
    const crateId = "crate-123";
    const releaseId = "release-456";
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    } as Response);

    await expect(
      removeReleaseFromCrate("crate-123", "release-456"),
    ).rejects.toThrow("HTTP error! status: 404");
  });
});

describe("syncCrates", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("syncs crates successfully", async () => {
    const collectionInstanceIds = ["id1", "id2", "id3"];
    const mockResponse = { success: true, removedCount: 2 };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(syncCrates(["id1"])).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});

describe("checkAuth", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("returns auth status when authenticated", async () => {
    const mockAuth = {
      isAuthenticated: true,
      username: "testuser",
      userId: "123456",
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAuth,
    } as Response);

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
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockAuth,
    } as Response);

    const result = await checkAuth();

    expect(result).toEqual(mockAuth);
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(checkAuth()).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("clearData", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("clears data successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await clearData();

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/clear-data", {
      method: "POST",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(clearData()).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("logout", () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  it("logs out successfully", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    } as Response);

    const result = await logout();

    expect(result).toEqual({ success: true });
    expect(mockFetch).toHaveBeenCalledWith("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    } as Response);

    await expect(logout()).rejects.toThrow("HTTP error! status: 500");
  });
});
