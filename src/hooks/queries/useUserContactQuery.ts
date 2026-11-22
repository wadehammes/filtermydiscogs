import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { UserContactQueryKeys } from "src/hooks/queries/querykeys.constants";

export const useUserContactQuery = ({
  userId,
  enabled = false,
}: {
  userId: string | number | null;
  enabled?: boolean;
}) => {
  return useQuery({
    queryKey: UserContactQueryKeys.byUserId(userId),
    queryFn: () => api.userContact(),
    enabled: enabled && userId != null,
    staleTime: 10 * 60 * 1000,
  });
};
