import type { DiscogsRelease } from "src/types";
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
