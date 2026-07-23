import type { DiscogsRelease } from "src/types/discogs-release.types";

const DISCOGS_IMAGE_PREFIXES = [
  "https://i.discogs.com/",
  "https://img.discogs.com/",
] as const;

const MAX_RELEASE_DATA_BYTES = 512_000;

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

/**
 * Validate and sanitize release payloads before persisting crate snapshots.
 */
export function validateReleaseDataForStorage(
  release: unknown,
):
  | { release: DiscogsRelease; error?: never }
  | { release?: never; error: string } {
  if (!release || typeof release !== "object") {
    return { error: "Invalid release data" };
  }

  const candidate = release as DiscogsRelease;

  if (!candidate.instance_id) {
    return { error: "Invalid release data: missing instance_id" };
  }

  if (
    !candidate.basic_information ||
    typeof candidate.basic_information.title !== "string" ||
    candidate.basic_information.title.trim().length === 0
  ) {
    return { error: "Invalid release data: missing basic_information" };
  }

  const serialized = JSON.stringify(candidate);
  if (serialized.length > MAX_RELEASE_DATA_BYTES) {
    return { error: "Release data is too large" };
  }

  return {
    release: {
      ...candidate,
      instance_id: String(candidate.instance_id),
      basic_information: sanitizeBasicInformation(candidate.basic_information),
    },
  };
}

/**
 * Strip private collection fields before exposing release snapshots on public crates.
 */
export function toPublicReleaseSnapshot(
  release: DiscogsRelease,
): Pick<DiscogsRelease, "instance_id" | "basic_information"> {
  return {
    instance_id: String(release.instance_id),
    basic_information: sanitizeBasicInformation(release.basic_information),
  };
}
