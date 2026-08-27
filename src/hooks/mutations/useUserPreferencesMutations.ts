import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { UserPreferencesQueryKeys } from "src/hooks/queries/querykeys.constants";
import type {
  UserPreferences,
  UserPreferencesPatch,
} from "src/types/userPreferences.types";

export const useUpdateUserPreferencesMutation = (
  userId: string | number | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserPreferencesPatch) =>
      api.updateUserPreferences(patch),
    onSuccess: (response) => {
      queryClient.setQueryData<UserPreferences>(
        UserPreferencesQueryKeys.byUserId(userId),
        response.preferences,
      );
    },
  });
};
