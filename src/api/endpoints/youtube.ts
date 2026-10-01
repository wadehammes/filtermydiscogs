export type YoutubeOembedResponse = {
  title: string;
  authorName: string;
};

export const fetchYoutubeOembed = async (
  videoId: string,
): Promise<YoutubeOembedResponse> => {
  const response = await fetch(
    `/api/youtube/oembed?video_id=${encodeURIComponent(videoId)}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json() as Promise<YoutubeOembedResponse>;
};
