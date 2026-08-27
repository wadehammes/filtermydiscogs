import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { UserPreferencesQueryKeys } from "src/hooks/queries/querykeys.constants";

export const useUserPreferencesQuery = ({
  userId,
  enabled = false,
}: {
  userId: string | number | null;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: UserPreferencesQueryKeys.byUserId(userId),
    queryFn: async () => {
      const response = await api.userPreferences();
      return response.preferences;
    },
    enabled: enabled && userId != null,
    staleTime: 10 * 60 * 1000,
  });
};
