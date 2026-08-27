import { useMutation } from "@tanstack/react-query";
import type { LogoutOptions } from "src/api/types";
import { api } from "src/api/urls";

export const useLogoutMutation = () =>
  useMutation({
    mutationFn: (options: LogoutOptions = {}) => api.logout(options),
  });

export const useClearDataMutation = () =>
  useMutation({
    mutationFn: api.clearData,
  });
