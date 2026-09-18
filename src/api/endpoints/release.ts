import { ApiFetchError, parseRetryAfterMs } from "src/api/apiFetchError";
import type { DiscogsReleaseDetail, DiscogsSearchResponse } from "src/types";

export interface FetchDiscogsReleaseOptions {
  bypassCache?: boolean;
}

export const fetchDiscogsRelease = async (
  releaseId: string,
  { bypassCache = false }: FetchDiscogsReleaseOptions = {},
): Promise<DiscogsReleaseDetail> => {
  try {
    const releasePath = bypassCache
      ? `/api/release/${releaseId}?fresh=1`
      : `/api/release/${releaseId}`;
    const response = await fetch(releasePath, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      ...(bypassCache ? { cache: "no-store" as const } : {}),
    });

    if (!response.ok) {
      throw new ApiFetchError(
        response.status,
        undefined,
        parseRetryAfterMs(response),
      );
    }

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch release");
  }
};

export const fetchDiscogsReleaseBatch = async (
  ids: string[],
): Promise<Record<string, DiscogsReleaseDetail>> => {
  try {
    const response = await fetch("/api/release/batch", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      throw new ApiFetchError(response.status);
    }

    const data = (await response.json()) as {
      releases: Record<string, DiscogsReleaseDetail>;
    };

    return data.releases ?? {};
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch releases");
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
