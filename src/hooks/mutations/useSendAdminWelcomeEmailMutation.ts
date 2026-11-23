import { useMutation } from "@tanstack/react-query";
import { api } from "src/api/urls";
import {
  AdminStatsQueryKeys,
  AdminWelcomeEmailPendingQueryKeys,
} from "src/hooks/queries/querykeys.constants";
import type { AdminWelcomeEmailSendResponse } from "src/types/adminWelcomeEmail.types";

export const useSendAdminWelcomeEmailMutation = () => {
  return useMutation<AdminWelcomeEmailSendResponse, Error, number>({
    mutationFn: (discogsUserId) => api.sendAdminWelcomeEmail(discogsUserId),
    meta: {
      invalidates: [
        AdminWelcomeEmailPendingQueryKeys.all(),
        AdminStatsQueryKeys.all(),
      ],
    },
    retry: false,
  });
};
