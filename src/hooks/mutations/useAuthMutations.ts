import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { LogoutOptions } from "src/api/types";
import { api } from "src/api/urls";
import { AuthQueryKeys } from "src/hooks/queries/querykeys.constants";
import type { AuthStatus } from "src/services/auth.service";

export const useLogoutMutation = () =>
  useMutation({
    mutationFn: (options: LogoutOptions = {}) => api.logout(options),
  });

export const useClearDataMutation = () =>
  useMutation({
    mutationFn: api.clearData,
  });

export const useDismissSupportProjectToastMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: api.dismissSupportProjectToast,
    onSuccess: () => {
      queryClient.setQueryData<AuthStatus>(AuthQueryKeys.all(), (current) =>
        current ? { ...current, showSupportProjectToast: false } : current,
      );
    },
  });
};
