import type {
  DiscogsCollection,
  DiscogsRelease,
  DiscogsReleaseJson,
  DiscogsSearchResponse,
} from "src/types";
import type {
  CratesResponse,
  CrateWithReleasesResponse,
} from "src/types/crate.types";
import type {
  CollectionValue,
  MostCratedRelease,
} from "src/types/dashboard.types";

export const fetchDiscogsCollection = async (
  username: string,
  page: number = 1,
): Promise<DiscogsCollection> => {
  try {
    const params = new URLSearchParams({
      username,
      page: page.toString(),
      sort: "added",
      sort_order: "desc",
    });

    const response = await fetch(`/api/collection?${params}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch collection");
  }
};

export const fetchDiscogsRelease = async (
  releaseId: string,
): Promise<DiscogsReleaseJson> => {
  try {
    const response = await fetch(`/api/release/${releaseId}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
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
    const response = await fetch("/api/crates", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Transform paginated response to backward-compatible format
    // API now returns { data: [...], pagination: {...} }
    // but we need { crates: [...] } for backward compatibility
    if (data.data && Array.isArray(data.data)) {
      return { crates: data.data };
    }

    // Fallback for old format (if API still returns it)
    if (data.crates && Array.isArray(data.crates)) {
      return data;
    }

    // If neither format, return empty array
    return { crates: [] };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch crates");
  }
};

export const fetchCrate = async (
  crateId: string,
): Promise<CrateWithReleasesResponse> => {
  try {
    const response = await fetch(`/api/crates/${crateId}`, {
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

export const updateCrate = async (
  crateId: string,
  updates: { name?: string; is_default?: boolean; private?: boolean },
): Promise<{
  crate: {
    user_id: number;
    id: string;
    name: string;
    username: string | null;
    is_default: boolean;
    private: boolean;
    created_at: Date;
    updated_at: Date;
  };
}> => {
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

export const logout = async (): Promise<{ success: boolean }> => {
  try {
    const response = await fetch("/api/auth/logout", {
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
