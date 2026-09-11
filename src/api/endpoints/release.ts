import { ApiFetchError } from "src/api/apiFetchError";
import type { DiscogsReleaseDetail, DiscogsSearchResponse } from "src/types";

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
