import { useQuery } from "@tanstack/react-query";
import type { CrateWithReleasesResponse } from "src/types/crate.types";

const fetchPublicCrate = async (
  crateId: string,
): Promise<CrateWithReleasesResponse> => {
  try {
    const response = await fetch(`/api/crates/public/${crateId}`, {
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

    return response.json();
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Failed to fetch public crate");
  }
};

export const usePublicCrateQuery = (crateId: string | null) => {
  const isEnabled = Boolean(crateId);

  return useQuery<CrateWithReleasesResponse>({
    queryKey: ["publicCrate", crateId],
    queryFn: async () => {
      if (!crateId) {
        throw new Error("Crate ID missing");
      }

      return fetchPublicCrate(crateId);
    },
    enabled: isEnabled,
    staleTime: 5 * 60 * 1000, // 5 minutes - public crates change less frequently
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
  });
};
