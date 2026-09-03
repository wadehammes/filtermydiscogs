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
  ReleaseCrateMembershipResponse,
} from "src/types/crate.types";

async function fetchAllCrates(): Promise<CratesResponse["crates"]> {
  const response = await fetch("/api/crates?all=true", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = (await response.json()) as {
    data?: CratesResponse["crates"];
    crates?: CratesResponse["crates"];
  };

  const crates = data.data ?? data.crates ?? [];
  return Array.isArray(crates) ? crates : [];
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
    const response = await fetch(`/api/crates/public/${crateId}?all=true`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

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

    return {
      crate: data.crate,
      releases: wrappedReleases,
      markers: [],
      ...(data.pagination !== undefined ? { pagination: data.pagination } : {}),
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to fetch public crate");
  }
};

export const fetchReleaseCrateMembership = async (
  instanceId: string,
): Promise<ReleaseCrateMembershipResponse> => {
  try {
    const response = await fetch(
      `/api/crates/membership/${encodeURIComponent(instanceId)}`,
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

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch release crate membership");
  }
};

export const setReleaseCrateMembership = async (
  instanceId: string,
  data: {
    crateIds: string[];
    release: DiscogsRelease;
  },
): Promise<{ success: boolean; crateIds: string[] }> => {
  try {
    const response = await fetch(
      `/api/crates/membership/${encodeURIComponent(instanceId)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      },
    );

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
    throw new Error("Failed to update release crate membership");
  }
};

export const fetchCrate = async (
  crateId: string,
): Promise<CrateWithReleasesResponse> => {
  try {
    const response = await fetch(`/api/crates/${crateId}?all=true`, {
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

export const migrateLegacyCrate = async (
  releases: DiscogsRelease[],
): Promise<{
  success: boolean;
  crateId: string;
  importedCount: number;
  skippedCount: number;
}> => {
  try {
    const response = await fetch("/api/crates/migrate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ releases }),
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
    throw new Error("Failed to migrate legacy crate");
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
