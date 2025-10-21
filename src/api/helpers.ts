import type {
  DiscogsCollection,
  DiscogsReleaseJson,
  DiscogsSearchResponse,
} from "src/types";

export const fetchDiscogsCollection = async (
  username: string,
  page: number = 1,
  sort: string = "added",
  sortOrder: string = "desc",
): Promise<DiscogsCollection> => {
  const params = new URLSearchParams({
    username,
    page: page.toString(),
    sort,
    sort_order: sortOrder,
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
};

export const fetchDiscogsRelease = async (
  releaseId: string,
): Promise<DiscogsReleaseJson> => {
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
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    per_page: perPage.toString(),
    type,
  });

  // Add optional parameters
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
};
