import type { AdminUserLookupStats } from "src/types/adminUserLookup.types";
import type {
  AdminWelcomeEmailPendingResponse,
  AdminWelcomeEmailSendResponse,
} from "src/types/adminWelcomeEmail.types";
import type {
  AdminStats,
  MostCratedRelease,
  TopUserTracksResponse,
} from "src/types/dashboard.types";

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

export const fetchTopUserTracks = async (
  limit: number = 10,
): Promise<TopUserTracksResponse> => {
  try {
    const response = await fetch(`/api/dashboard/top-tracks?limit=${limit}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Failed to fetch top tracks: ${response.statusText}`,
      );
    }

    return response.json() as Promise<TopUserTracksResponse>;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch top tracks");
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

export const fetchAdminWelcomeEmailPending =
  async (): Promise<AdminWelcomeEmailPendingResponse> => {
    try {
      const response = await fetch("/api/admin/welcome-email/pending", {
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

        throw new Error(
          `Failed to fetch welcome email queue: ${response.statusText}`,
        );
      }

      return response.json() as Promise<AdminWelcomeEmailPendingResponse>;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("Failed to fetch welcome email queue");
    }
  };

export const sendAdminWelcomeEmail = async (
  discogsUserId: number,
): Promise<AdminWelcomeEmailSendResponse> => {
  try {
    const response = await fetch("/api/admin/welcome-email/send", {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ discogsUserId }),
    });

    if (!response.ok) {
      const errorData = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        errorData.error ??
          `Failed to send welcome email: ${response.statusText}`,
      );
    }

    return response.json() as Promise<AdminWelcomeEmailSendResponse>;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }

    throw new Error("Failed to send welcome email");
  }
};
