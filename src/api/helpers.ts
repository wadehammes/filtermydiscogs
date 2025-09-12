import type { DiscogsCollection, DiscogsReleaseJson } from "src/types";

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
