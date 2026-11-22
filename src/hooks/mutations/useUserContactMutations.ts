import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { UserContactQueryKeys } from "src/hooks/queries/querykeys.constants";
import type {
  UserContact,
  UserContactPatch,
} from "src/types/userContact.types";

export const useUpdateUserContactMutation = (
  userId: string | number | null,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (patch: UserContactPatch) => api.updateUserContact(patch),
    onSuccess: (contact: UserContact) => {
      queryClient.setQueryData(UserContactQueryKeys.byUserId(userId), contact);
    },
  });
};
