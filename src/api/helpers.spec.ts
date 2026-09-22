import { describe, expect, it } from "@jest/globals";
import { authStatusFactory } from "src/tests/factories/AuthStatus.factory";
import { collectionFactory } from "src/tests/factories/Collection.factory";
import { crateFactory } from "src/tests/factories/Crate.factory";
import { crateMutationSuccessFactory } from "src/tests/factories/CrateMutationSuccess.factory";
import { crateWithCountFactory } from "src/tests/factories/CrateWithCount.factory";
import { crateWithReleasesResponseFactory } from "src/tests/factories/CrateWithReleasesResponse.factory";
import { createCrateResponseFactory } from "src/tests/factories/CreateCrateResponse.factory";
import { discogsReleaseJsonFactory } from "src/tests/factories/DiscogsReleaseJson.factory";
import { discogsSearchResponseFactory } from "src/tests/factories/DiscogsSearchResponse.factory";
import { releaseFactory } from "src/tests/factories/Release.factory";
import {
  expectLastFetchCalledWith,
  expectLastFetchCalledWithBody,
  getLastFetchUrl,
  jsonRoundTrip,
  mockFetchEmptyOnce,
  mockFetchErrorOnce,
  mockFetchJsonOnce,
  mockFetchNetworkErrorOnce,
} from "src/tests/msw/mswFetchTestHelpers";
import { checkAuth, clearData, logout } from "./endpoints/auth";
import { fetchBuildVersion } from "./endpoints/buildVersion";
import { fetchDiscogsCollection } from "./endpoints/collection";
import {
  addReleaseToCrate,
  clearAllPackedInCrate,
  createCrate,
  deleteCrate,
  fetchCrate,
  fetchCrates,
  removeReleaseFromCrate,
  setReleasePackedInCrate,
  syncCrates,
  updateCrate,
} from "./endpoints/crates";
import { fetchDiscogsRelease, fetchDiscogsSearch } from "./endpoints/release";

describe("fetchDiscogsCollection", () => {
  it("fetches collection successfully", async () => {
    const mockCollection = collectionFactory.build();
    mockFetchJsonOnce("get", "/api/collection", mockCollection);

    const result = await fetchDiscogsCollection({
      username: "testuser",
      page: 1,
    });

    expect(result).toEqual(mockCollection);
    expectLastFetchCalledWith(
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
    mockFetchJsonOnce("get", "/api/collection", mockCollection);

    await fetchDiscogsCollection({ username: "testuser" });

    expect(getLastFetchUrl()).toMatch(/page=1.*per_page=100/);
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/collection", 500);

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow("HTTP error! status: 500");
  });

  it("uses API error message when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/collection", 502, {
      error:
        "Discogs returned an error (their servers may be overloaded or temporarily down). Try again in a few minutes.",
    });

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow(
      "Discogs returned an error (their servers may be overloaded or temporarily down). Try again in a few minutes.",
    );
  });

  it("throws error on network failure", async () => {
    mockFetchNetworkErrorOnce("get", "/api/collection");

    await expect(
      fetchDiscogsCollection({ username: "testuser" }),
    ).rejects.toThrow("HTTP error! status: 500");
  });
});

describe("fetchDiscogsRelease", () => {
  it("fetches release successfully", async () => {
    const mockRelease = discogsReleaseJsonFactory.forReleaseId(123, {
      title: "Test Release",
    });
    mockFetchJsonOnce("get", "/api/release/123", mockRelease);

    const result = await fetchDiscogsRelease("123");

    expect(result).toEqual(jsonRoundTrip(mockRelease));
    expectLastFetchCalledWith("/api/release/123", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("bypasses the HTTP cache when bypassCache is true", async () => {
    mockFetchJsonOnce(
      "get",
      "/api/release/123",
      discogsReleaseJsonFactory.forReleaseId(123),
    );

    await fetchDiscogsRelease("123", { bypassCache: true });

    expectLastFetchCalledWith("/api/release/123?fresh=1", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/release/123", 404);

    await expect(fetchDiscogsRelease("123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });

  it("throws error on network failure", async () => {
    mockFetchNetworkErrorOnce("get", "/api/release/123");

    await expect(fetchDiscogsRelease("123")).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});

describe("fetchDiscogsSearch", () => {
  it("fetches search results successfully with all parameters", async () => {
    const mockSearch = discogsSearchResponseFactory.build();
    mockFetchJsonOnce("get", "/api/search", mockSearch);

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

    expect(result).toEqual(jsonRoundTrip(mockSearch));
    expect(getLastFetchUrl()).toContain("q=test");
  });

  it("uses default parameters when not provided", async () => {
    const mockSearch = discogsSearchResponseFactory.build();
    mockFetchJsonOnce("get", "/api/search", mockSearch);

    await fetchDiscogsSearch("test");

    expect(getLastFetchUrl()).toContain("page=1&per_page=100&type=release");
  });

  it("includes optional parameters when provided", async () => {
    const mockSearch = discogsSearchResponseFactory.build();
    mockFetchJsonOnce("get", "/api/search", mockSearch);

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

    const callUrl = getLastFetchUrl();
    expect(callUrl).toContain("format=LP");
    expect(callUrl).toContain("year=2020");
    expect(callUrl).toContain("genre=Rock");
    expect(callUrl).toContain("style=Shoegaze");
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/search", 400);

    await expect(fetchDiscogsSearch("test")).rejects.toThrow(
      "HTTP error! status: 400",
    );
  });
});

describe("fetchCrates", () => {
  it("fetches crates successfully", async () => {
    const crates = crateWithCountFactory.buildList(3);
    mockFetchJsonOnce("get", "/api/crates", { data: crates });

    const result = await fetchCrates();

    expect(result).toEqual({ crates: jsonRoundTrip(crates) });
    expectLastFetchCalledWith("/api/crates?all=true", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/crates", 401);

    await expect(fetchCrates()).rejects.toThrow("HTTP error! status: 401");
  });
});

describe("fetchCrate", () => {
  it("fetches crate successfully", async () => {
    const crateId = "crate-123";
    const crate = crateFactory.build({ id: crateId });
    const mockCrate = crateWithReleasesResponseFactory.withReleases(
      crate,
      releaseFactory.buildList(5),
    );
    mockFetchJsonOnce("get", "/api/crates/:crateId", mockCrate);

    const result = await fetchCrate(crateId);

    expect(result).toEqual(jsonRoundTrip(mockCrate));
    expectLastFetchCalledWith(`/api/crates/${crateId}?all=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/crates/:crateId", 404);

    await expect(fetchCrate("crate-123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("createCrate", () => {
  it("creates crate successfully", async () => {
    const crateName = "My New Crate";
    const mockCrate = crateFactory.build({ name: crateName });
    mockFetchJsonOnce(
      "post",
      "/api/crates",
      createCrateResponseFactory.forCrate(mockCrate),
    );

    const result = await createCrate(crateName);

    expect(result.crate).toEqual(jsonRoundTrip(mockCrate));
    await expectLastFetchCalledWithBody("/api/crates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name: crateName }),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("post", "/api/crates", 400);

    await expect(createCrate("Test")).rejects.toThrow(
      "HTTP error! status: 400",
    );
  });
});

describe("updateCrate", () => {
  it("updates crate successfully with name", async () => {
    const crateId = "crate-123";
    const updates = { name: "Updated Name" };
    const mockCrate = crateFactory.build({ id: crateId, name: updates.name });
    mockFetchJsonOnce("put", "/api/crates/:crateId", {
      crate: mockCrate,
    });

    const result = await updateCrate(crateId, updates);

    expect(result.crate).toEqual(jsonRoundTrip(mockCrate));
    await expectLastFetchCalledWithBody(`/api/crates/${crateId}`, {
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
    mockFetchJsonOnce("put", "/api/crates/:crateId", {
      crate: mockCrate,
    });

    const result = await updateCrate(crateId, updates);

    expect(result.crate).toEqual(jsonRoundTrip(mockCrate));
    await expectLastFetchCalledWithBody(`/api/crates/${crateId}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("put", "/api/crates/:crateId", 404);

    await expect(updateCrate("crate-123", { name: "Test" })).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("deleteCrate", () => {
  it("deletes crate successfully", async () => {
    const crateId = "crate-123";
    mockFetchEmptyOnce("delete", "/api/crates/:crateId");

    await deleteCrate(crateId);

    expectLastFetchCalledWith(`/api/crates/${crateId}`, {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("delete", "/api/crates/:crateId", 404);

    await expect(deleteCrate("crate-123")).rejects.toThrow(
      "HTTP error! status: 404",
    );
  });
});

describe("addReleaseToCrate", () => {
  it("adds release to crate successfully", async () => {
    const crateId = "crate-123";
    const release = releaseFactory.build();
    mockFetchJsonOnce(
      "post",
      "/api/crates/:crateId/releases",
      crateMutationSuccessFactory.build(),
    );

    const result = await addReleaseToCrate(crateId, release);

    expect(result).toEqual({ success: true });
    await expectLastFetchCalledWithBody(`/api/crates/${crateId}/releases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(release),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("post", "/api/crates/:crateId/releases", 400);

    await expect(
      addReleaseToCrate("crate-123", releaseFactory.build()),
    ).rejects.toThrow("HTTP error! status: 400");
  });
});

describe("removeReleaseFromCrate", () => {
  it("removes release from crate successfully", async () => {
    const crateId = "crate-123";
    const releaseId = "release-456";
    mockFetchJsonOnce(
      "delete",
      "/api/crates/:crateId/releases/:releaseId",
      crateMutationSuccessFactory.build(),
    );

    const result = await removeReleaseFromCrate(crateId, releaseId);

    expect(result).toEqual({ success: true });
    expectLastFetchCalledWith(`/api/crates/${crateId}/releases/${releaseId}`, {
      method: "DELETE",
      credentials: "include",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce(
      "delete",
      "/api/crates/:crateId/releases/:releaseId",
      404,
    );

    await expect(
      removeReleaseFromCrate("crate-123", "release-456"),
    ).rejects.toThrow("HTTP error! status: 404");
  });
});

describe("setReleasePackedInCrate", () => {
  it("updates packed status successfully", async () => {
    const crateId = "crate-123";
    const releaseId = "release-456";
    mockFetchJsonOnce("patch", "/api/crates/:crateId/releases/:releaseId", {
      ...crateMutationSuccessFactory.build(),
      found_at: "2026-07-27T00:00:00.000Z",
    });

    const result = await setReleasePackedInCrate(crateId, releaseId, true);

    expect(result).toEqual({
      success: true,
      found_at: "2026-07-27T00:00:00.000Z",
    });
    await expectLastFetchCalledWithBody(
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
  it("clears packed status successfully", async () => {
    const crateId = "crate-123";
    mockFetchJsonOnce(
      "patch",
      "/api/crates/:crateId/releases",
      crateMutationSuccessFactory.clearPacked(2),
    );

    const result = await clearAllPackedInCrate(crateId);

    expect(result).toEqual({
      success: true,
      cleared_count: 2,
    });
    await expectLastFetchCalledWithBody(`/api/crates/${crateId}/releases`, {
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
  it("syncs crates successfully", async () => {
    const collectionInstanceIds = ["id1", "id2", "id3"];
    const mockResponse = crateMutationSuccessFactory.sync(2);
    mockFetchJsonOnce("post", "/api/crates/sync", mockResponse);

    const result = await syncCrates(collectionInstanceIds);

    expect(result).toEqual(mockResponse);
    await expectLastFetchCalledWithBody("/api/crates/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ collectionInstanceIds }),
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("post", "/api/crates/sync", 500);

    await expect(syncCrates(["id1"])).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });
});

describe("checkAuth", () => {
  it("returns auth status when authenticated", async () => {
    const mockAuth = authStatusFactory.authenticated({
      userId: "123456",
      username: "testuser",
    });
    mockFetchJsonOnce("get", "/api/auth/check", mockAuth);

    const result = await checkAuth();

    expect(result).toEqual(mockAuth);
    expectLastFetchCalledWith("/api/auth/check", {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "GET",
    });
  });

  it("returns auth status when not authenticated", async () => {
    const mockAuth = authStatusFactory.unauthenticated();
    mockFetchJsonOnce("get", "/api/auth/check", mockAuth);

    const result = await checkAuth();

    expect(result).toEqual(mockAuth);
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/auth/check", 500);

    await expect(checkAuth()).rejects.toThrow(
      "Fetch failed: 500 Internal Server Error",
    );
  });
});

describe("clearData", () => {
  it("clears data successfully", async () => {
    mockFetchJsonOnce(
      "post",
      "/api/auth/clear-data",
      crateMutationSuccessFactory.build(),
    );

    const result = await clearData();

    expect(result).toEqual({ success: true });
    expectLastFetchCalledWith("/api/auth/clear-data", {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("post", "/api/auth/clear-data", 500);

    await expect(clearData()).rejects.toThrow(
      "Fetch failed: 500 Internal Server Error",
    );
  });
});

describe("logout", () => {
  it("logs out successfully", async () => {
    mockFetchJsonOnce(
      "post",
      "/api/auth/logout",
      crateMutationSuccessFactory.build(),
    );

    const result = await logout();

    expect(result).toEqual({ success: true });
    expectLastFetchCalledWith("/api/auth/logout", {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("revokes tokens when preserveTokens is false", async () => {
    mockFetchJsonOnce(
      "post",
      "/api/auth/logout",
      crateMutationSuccessFactory.build(),
    );

    await logout({ preserveTokens: false });

    expectLastFetchCalledWith("/api/auth/logout?preserve_tokens=false", {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      method: "POST",
    });
  });

  it("throws error when response is not ok", async () => {
    mockFetchErrorOnce("post", "/api/auth/logout", 500);

    await expect(logout()).rejects.toThrow(
      "Fetch failed: 500 Internal Server Error",
    );
  });
});

describe("fetchBuildVersion", () => {
  it("returns the current build version", async () => {
    mockFetchJsonOnce("get", "/api/build-version", { version: "abc123" });

    await expect(fetchBuildVersion()).resolves.toEqual({ version: "abc123" });

    expectLastFetchCalledWith("/api/build-version", {
      cache: "no-store",
    });
  });

  it("throws when the response is not ok", async () => {
    mockFetchErrorOnce("get", "/api/build-version", 500);

    await expect(fetchBuildVersion()).rejects.toThrow(
      "HTTP error! status: 500",
    );
  });

  it("throws when the version field is missing", async () => {
    mockFetchJsonOnce("get", "/api/build-version", {});

    await expect(fetchBuildVersion()).rejects.toThrow(
      "Invalid build version response",
    );
  });
});
