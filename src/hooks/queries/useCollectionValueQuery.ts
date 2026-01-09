import { useQuery } from "@tanstack/react-query";
import { fetchCollectionValue } from "src/api/helpers";
import type { CollectionValue } from "src/types/dashboard.types";

export const useCollectionValueQuery = (username: string | null) => {
  return useQuery<CollectionValue>({
    queryKey: ["collectionValue", username],
    queryFn: async () => {
      if (!username) {
        throw new Error("Username is required");
      }
      try {
        const data = await fetchCollectionValue(username);
        // The API route already validates and parses the data, so we can trust it
        // But add a safety check anyway
        if (
          !data ||
          typeof data.minimum !== "number" ||
          typeof data.median !== "number" ||
          typeof data.maximum !== "number"
        ) {
          throw new Error("Invalid collection value data received");
        }
        return data;
      } catch (error) {
        console.error("Collection value query error:", error);
        throw error;
      }
    },
    enabled: !!username,
    staleTime: 60 * 60 * 1000, // 1 hour - value doesn't change frequently
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    retry: 1, // Retry once on failure
  });
};
