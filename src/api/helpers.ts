import type { DiscogsCollection, DiscogsReleaseJson } from "src/types";

export const fetchDiscogsCollection = async (
  username: string,
  page: number = 1,
): Promise<DiscogsCollection> => {
  const response = await fetch(
    `/api/collection?username=${username}&page=${page}`,
    {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  );

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
