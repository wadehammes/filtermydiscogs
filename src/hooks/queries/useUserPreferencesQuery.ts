import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchUserPreferences, updateUserPreferences } from "src/api/helpers";
import { UserPreferencesQueryKeys } from "src/hooks/queries/querykeys.constants";
import type {
  UserPreferences,
  UserPreferencesPatch,
} from "src/types/userPreferences.types";

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
      const response = await fetchUserPreferences();
      return response.preferences;
    },
    enabled: enabled && userId != null,
    staleTime: 10 * 60 * 1000,
  });
};

export const useUpdateUserPreferencesMutation = (
  userId: string | number | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserPreferencesPatch) => updateUserPreferences(patch),
    onSuccess: (response) => {
      queryClient.setQueryData<UserPreferences>(
        UserPreferencesQueryKeys.byUserId(userId),
        response.preferences,
      );
    },
  });
};
