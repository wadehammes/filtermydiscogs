import { ApiFetchError, parseRetryAfterMs } from "src/api/apiFetchError";
import { COLLECTION_PAGE_SIZE } from "src/constants/collection";
import type {
  DiscogsCollection,
  DiscogsCollectionFieldsResponse,
  DiscogsRelease,
  DiscogsReleaseDetail,
  DiscogsSearchResponse,
} from "src/types";
import type { AdminUserLookupStats } from "src/types/adminUserLookup.types";
import type {
  Crate,
  CrateLayoutPutRequest,
  CrateReleaseItem,
  CrateSetMarker,
  CratesResponse,
  CrateUpdatePayload,
  CrateWithReleasesResponse,
  PaginationInfo,
} from "src/types/crate.types";
import type {
  AdminStats,
  CollectionValue,
  MostCratedRelease,
} from "src/types/dashboard.types";
import type {
  UserPreferences,
  UserPreferencesPatch,
} from "src/types/userPreferences.types";

const CRATE_PAGE_SIZE = 100;

async function fetchPaginatedCrateReleases({
  buildUrl,
  init,
  notFoundMessage,
}: {
  buildUrl: (page: number) => string;
  init: RequestInit;
  notFoundMessage?: string;
}): Promise<CrateWithReleasesResponse> {
  let page = 1;
  let result: CrateWithReleasesResponse | null = null;

  while (true) {
    const response = await fetch(buildUrl(page), init);

    if (!response.ok) {
      if (notFoundMessage && response.status === 404) {
        throw new Error(notFoundMessage);
      }

      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as CrateWithReleasesResponse;

    if (!result) {
      result = {
        crate: data.crate,
        releases: [...data.releases],
        markers: [...(data.markers ?? [])],
        ...(data.pagination !== undefined
          ? { pagination: data.pagination }
          : {}),
      };
    } else {
      result.releases.push(...data.releases);
      if (data.pagination !== undefined) {
        result.pagination = data.pagination;
      }
    }

    if (!data.pagination?.hasNextPage) {
      break;
    }

    page += 1;
  }

  if (!result) {
    throw new Error("Failed to fetch crate");
  }

  return result;
}

async function fetchAllCrates(): Promise<CratesResponse["crates"]> {
  const crates: CratesResponse["crates"] = [];
  let page = 1;

  while (true) {
    const response = await fetch(
      `/api/crates?page=${page}&pageSize=${CRATE_PAGE_SIZE}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as {
      data?: CratesResponse["crates"];
      crates?: CratesResponse["crates"];
      pagination?: PaginationInfo;
    };

    const pageCrates = data.data ?? data.crates ?? [];
    if (!Array.isArray(pageCrates)) {
      return [];
    }

    crates.push(...pageCrates);

    if (!data.pagination?.hasNextPage) {
      break;
    }

    page += 1;
  }

  return crates;
}

async function messageFromFailedApiResponse(
  response: Response,
): Promise<string> {
  try {
    const data = (await response.json()) as {
      error?: unknown;
      details?: unknown;
    };
    if (typeof data?.error === "string" && data.error.length > 0) {
      return data.error;
    }
    if (typeof data?.details === "string" && data.details.length > 0) {
      return data.details;
    }
  } catch {
    // non-JSON body
  }
  return `HTTP error! status: ${response.status}`;
}

async function parseSuccessResponse<T>(response: Response): Promise<T> {
  const bodyText = await response.text();
  if (!bodyText.trim()) {
    return { success: true } as T;
  }

  return JSON.parse(bodyText) as T;
}

export interface FetchDiscogsCollectionParams {
  username: string;
  page?: number;
  perPage?: number;
}

export const fetchDiscogsCollection = async ({
  username,
  page = 1,
  perPage = COLLECTION_PAGE_SIZE,
}: FetchDiscogsCollectionParams): Promise<DiscogsCollection> => {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      per_page: perPage.toString(),
      sort: "added",
      sort_order: "desc",
      username,
    });

    const response = await fetch(`/api/collection?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new ApiFetchError(
        response.status,
        await messageFromFailedApiResponse(response),
        parseRetryAfterMs(response),
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection");
  }
};

export const fetchCollectionFields = async (
  username: string,
): Promise<DiscogsCollectionFieldsResponse> => {
  try {
    const params = new URLSearchParams({ username });
    const response = await fetch(`/api/collection/fields?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection fields");
  }
};

export interface UpdateCollectionNoteParams {
  username: string;
  instanceId: string;
  fieldId: number;
  releaseId: number;
  folderId: number;
  value: string;
}

export const updateCollectionNote = async ({
  username,
  instanceId,
  fieldId,
  releaseId,
  folderId,
  value,
}: UpdateCollectionNoteParams): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `/api/collection/instances/${instanceId}/fields/${fieldId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          releaseId,
          folderId,
          value,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return parseSuccessResponse<{ success: boolean }>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update collection note");
  }
};
interface UpdateReleaseRatingParams {
  username: string;
  releaseId: number;
  rating: number;
}

export const updateReleaseRating = async ({
  username,
  releaseId,
  rating,
}: UpdateReleaseRatingParams): Promise<{
  username: string;
  release_id: number;
  rating: number;
}> => {
  try {
    const response = await fetch(
      `/api/collection/releases/${releaseId}/rating`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          username,
          rating,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return parseSuccessResponse<{
      username: string;
      release_id: number;
      rating: number;
    }>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update release rating");
  }
};

interface ClearReleaseRatingParams {
  username: string;
  releaseId: number;
}

export const clearReleaseRating = async ({
  username,
  releaseId,
}: ClearReleaseRatingParams): Promise<{ success: boolean }> => {
  try {
    const params = new URLSearchParams({ username });
    const response = await fetch(
      `/api/collection/releases/${releaseId}/rating?${params.toString()}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(await messageFromFailedApiResponse(response));
    }

    return parseSuccessResponse<{ success: boolean }>(response);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to clear release rating");
  }
};

export const fetchDiscogsRelease = async (
  releaseId: string,
): Promise<DiscogsReleaseDetail> => {
  try {
    const response = await fetch(`/api/release/${releaseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new ApiFetchError(response.status);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch release");
  }
};

export const fetchDiscogsSearch = async (
  query: string,
  page: number = 1,
  perPage: number = 100,
  type: string = "release",
  format?: string,
  year?: string,
  genre?: string,
  style?: string,
): Promise<DiscogsSearchResponse> => {
  try {
    const params = new URLSearchParams({
      q: query,
      page: page.toString(),
      per_page: perPage.toString(),
      type,
    });

    if (format) params.append("format", format);
    if (year) params.append("year", year);
    if (genre) params.append("genre", genre);
    if (style) params.append("style", style);

    const response = await fetch(`/api/search?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to search releases");
  }
};

export const fetchCrates = async (): Promise<CratesResponse> => {
  try {
    return { crates: await fetchAllCrates() };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch crates");
  }
};

export const fetchPublicCrate = async (
  crateId: string,
): Promise<CrateWithReleasesResponse> => {
  try {
    let page = 1;
    let result: CrateWithReleasesResponse | null = null;

    while (true) {
      const response = await fetch(
        `/api/crates/public/${crateId}?page=${page}&pageSize=${CRATE_PAGE_SIZE}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Crate not found or is private");
        }

        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = (await response.json()) as {
        crate: CrateWithReleasesResponse["crate"];
        releases: DiscogsRelease[];
        pagination?: PaginationInfo;
      };

      const wrappedReleases = data.releases.map((release, index) => ({
        release,
        found_at: null,
        sort_order: (index + 1) * 1000,
      }));

      if (!result) {
        result = {
          crate: data.crate,
          releases: [...wrappedReleases],
          markers: [],
          ...(data.pagination !== undefined
            ? { pagination: data.pagination }
            : {}),
        };
      } else {
        result.releases.push(...wrappedReleases);
        if (data.pagination !== undefined) {
          result.pagination = data.pagination;
        }
      }

      if (!data.pagination?.hasNextPage) {
        break;
      }

      page += 1;
    }

    if (!result) {
      throw new Error("Failed to fetch public crate");
    }

    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to fetch public crate");
  }
};

export const fetchCrate = async (
  crateId: string,
): Promise<CrateWithReleasesResponse> => {
  try {
    return fetchPaginatedCrateReleases({
      buildUrl: (page) =>
        `/api/crates/${crateId}?page=${page}&pageSize=${CRATE_PAGE_SIZE}`,
      init: {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch crate");
  }
};

export const createCrate = async (
  name: string,
): Promise<{
  crate: {
    user_id: number;
    id: string;
    name: string;
    username: string | null;
    is_default: boolean;
    private: boolean;
    packed_enabled: boolean;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  };
}> => {
  try {
    const response = await fetch("/api/crates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ name }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to create crate");
  }
};

export const updateCrateLayout = async (
  crateId: string,
  layout: CrateLayoutPutRequest,
): Promise<{
  success: boolean;
  releases: CrateReleaseItem[];
  markers: CrateSetMarker[];
}> => {
  try {
    const response = await fetch(`/api/crates/${crateId}/layout`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(layout),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update crate layout");
  }
};

export const updateCrate = async (
  crateId: string,
  updates: Partial<CrateUpdatePayload>,
): Promise<{ crate: Crate }> => {
  try {
    const bodyString = JSON.stringify(updates);
    const response = await fetch(`/api/crates/${crateId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: bodyString,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage =
        errorData?.error || `HTTP error! status: ${response.status}`;
      throw new Error(errorMessage);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update crate");
  }
};

export const deleteCrate = async (crateId: string): Promise<void> => {
  try {
    const response = await fetch(`/api/crates/${crateId}`, {
      method: "DELETE",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to delete crate");
  }
};

export const addReleaseToCrate = async (
  crateId: string,
  release: DiscogsRelease,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(`/api/crates/${crateId}/releases`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(release),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to add release to crate");
  }
};

export const removeReleaseFromCrate = async (
  crateId: string,
  releaseId: string,
): Promise<{ success: boolean }> => {
  try {
    const response = await fetch(
      `/api/crates/${crateId}/releases/${releaseId}`,
      {
        method: "DELETE",
        credentials: "include",
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to remove release from crate");
  }
};

export const setReleasePackedInCrate = async (
  crateId: string,
  releaseId: string,
  found: boolean,
): Promise<{ success: boolean; found_at: string | null }> => {
  try {
    const response = await fetch(
      `/api/crates/${crateId}/releases/${releaseId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ found }),
      },
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to update crate release found status");
  }
};

export const clearAllPackedInCrate = async (
  crateId: string,
): Promise<{ success: boolean; cleared_count: number }> => {
  try {
    const response = await fetch(`/api/crates/${crateId}/releases`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clear_found: true }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to clear packed status in crate");
  }
};

export const syncCrates = async (
  collectionInstanceIds: string[],
): Promise<{ success: boolean; removedCount: number }> => {
  try {
    const response = await fetch("/api/crates/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ collectionInstanceIds }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to sync crates");
  }
};

export const checkAuth = async (): Promise<{
  isAuthenticated: boolean;
  username: string | null;
  userId: string | null;
  reconnectUsername: string | null;
  rateLimited?: boolean;
}> => {
  try {
    const response = await fetch("/api/auth/check", {
      method: "GET",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to check auth status");
  }
};

export const clearData = async (): Promise<{ success: boolean }> => {
  try {
    const response = await fetch("/api/auth/clear-data", {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to clear data");
  }
};

export type LogoutOptions = {
  preserveTokens?: boolean;
};

export const logout = async ({
  preserveTokens = true,
}: LogoutOptions = {}): Promise<{ success: boolean }> => {
  try {
    const query = preserveTokens ? "" : "?preserve_tokens=false";
    const response = await fetch(`/api/auth/logout${query}`, {
      method: "POST",
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to logout");
  }
};

export const fetchUserPreferences = async (): Promise<{
  preferences: UserPreferences;
}> => {
  const response = await fetch("/api/user/preferences", {
    method: "GET",
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const updateUserPreferences = async (
  patch: UserPreferencesPatch,
): Promise<{
  preferences: UserPreferences;
}> => {
  const response = await fetch("/api/user/preferences", {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(patch),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const fetchCollectionValue = async (
  username: string,
): Promise<CollectionValue> => {
  try {
    const params = new URLSearchParams({
      username,
    });

    const response = await fetch(`/api/collection/value?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Failed to fetch collection value: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection value");
  }
};

export const fetchMostCratedReleases = async (
  limit: number = 10,
): Promise<MostCratedRelease[]> => {
  try {
    const response = await fetch(`/api/dashboard/most-crated?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error ||
          `Failed to fetch most crated releases: ${response.statusText}`,
      );
    }

    const data = await response.json();
    return data.releases || [];
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch most crated releases");
  }
};

export const fetchAdminStats = async (): Promise<AdminStats> => {
  try {
    const response = await fetch("/api/admin/stats", {
      method: "GET",
      credentials: "include",
      headers: {
        "Cache-Control": "no-cache",
      },
    });

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Forbidden: Admin access required");
      }

      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in");
      }

      throw new Error(`Failed to fetch admin stats: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to fetch admin stats");
  }
};

export const fetchAdminUserLookup = async (
  username: string,
): Promise<AdminUserLookupStats> => {
  try {
    const response = await fetch(
      `/api/admin/users/${encodeURIComponent(username)}`,
      {
        method: "GET",
        credentials: "include",
        headers: {
          "Cache-Control": "no-cache",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 403) {
        throw new Error("Forbidden: Admin access required");
      }

      if (response.status === 401) {
        throw new Error("Unauthorized: Please log in");
      }

      if (response.status === 404) {
        throw new Error("User not found");
      }

      if (response.status === 400) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Invalid username");
      }

      throw new Error(`Failed to look up user: ${response.statusText}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to look up user");
  }
};
