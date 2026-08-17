import { crateReleaseStorageSchema } from "src/lib/validation/releaseStorage.schemas";
import type { DiscogsRelease } from "src/types/discogs-release.types";

const DISCOGS_IMAGE_PREFIXES = [
  "https://i.discogs.com/",
  "https://img.discogs.com/",
] as const;

function isDiscogsImageUrl(value: unknown): value is string {
  return (
    typeof value === "string" &&
    DISCOGS_IMAGE_PREFIXES.some((prefix) => value.startsWith(prefix))
  );
}

function sanitizeBasicInformation(
  basicInformation: DiscogsRelease["basic_information"],
): DiscogsRelease["basic_information"] {
  return {
    ...basicInformation,
    thumb: isDiscogsImageUrl(basicInformation.thumb)
      ? basicInformation.thumb
      : "",
    cover_image: isDiscogsImageUrl(basicInformation.cover_image)
      ? basicInformation.cover_image
      : "",
  };
}

export function validateReleaseDataForStorage(
  release: unknown,
):
  | { release: DiscogsRelease; error?: never }
  | { release?: never; error: string } {
  if (!release || typeof release !== "object") {
    return { error: "Invalid release data" };
  }

  const parseResult = crateReleaseStorageSchema.safeParse(release);

  if (!parseResult.success) {
    const issue = parseResult.error.issues[0];
    return { error: issue?.message ?? "Invalid release data" };
  }

  const candidate = release as DiscogsRelease;

  return {
    release: {
      ...candidate,
      instance_id: String(candidate.instance_id),
      basic_information: sanitizeBasicInformation(candidate.basic_information),
    },
  };
}

export function toPublicReleaseSnapshot(
  release: DiscogsRelease,
): Pick<DiscogsRelease, "instance_id" | "basic_information"> {
  return {
    instance_id: String(release.instance_id),
    basic_information: sanitizeBasicInformation(release.basic_information),
  };
}
