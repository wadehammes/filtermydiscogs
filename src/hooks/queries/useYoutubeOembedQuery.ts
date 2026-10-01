import { useQuery } from "@tanstack/react-query";
import { api } from "src/api/urls";
import { YoutubeOembedQueryKeys } from "src/hooks/queries/querykeys.constants";

export const useYoutubeOembedQuery = ({
  videoId,
  enabled = true,
}: {
  videoId: string | null;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: YoutubeOembedQueryKeys.byVideoId(videoId ?? ""),
    queryFn: () => api.fetchYoutubeOembed(videoId as string),
    enabled: enabled && Boolean(videoId),
    staleTime: 60 * 60 * 1000,
    retry: false,
  });
