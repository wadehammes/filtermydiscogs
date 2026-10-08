import { getResourceUrl } from "src/utils/helpers";

export const getDiscogsReleaseVideosUpdateUrl = (
  releaseId: number | string | null | undefined,
): string | null => {
  const releaseUrl = getResourceUrl({
    type: "release",
    id: releaseId,
  });

  if (!releaseUrl) {
    return null;
  }

  return `${releaseUrl}/videos/update`;
};
