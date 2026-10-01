import { z } from "zod";

const youtubeOembedResponseSchema = z.object({
  title: z.string().trim().min(1),
  author_name: z.string().trim().min(1),
});

export type YoutubeOembedMetadata = {
  title: string;
  authorName: string;
};

export const fetchYoutubeOembedMetadata = async (
  videoId: string,
): Promise<YoutubeOembedMetadata | null> => {
  const oembedUrl = new URL("https://www.youtube.com/oembed");
  oembedUrl.searchParams.set(
    "url",
    `https://www.youtube.com/watch?v=${videoId}`,
  );
  oembedUrl.searchParams.set("format", "json");

  const response = await fetch(oembedUrl, {
    headers: {
      "User-Agent": "FilterMyDiscogs/1.0 (https://filtermydiscogs.com)",
    },
  });

  if (!response.ok) {
    return null;
  }

  const parsed = youtubeOembedResponseSchema.safeParse(await response.json());

  if (!parsed.success) {
    return null;
  }

  return {
    title: parsed.data.title,
    authorName: parsed.data.author_name,
  };
};
