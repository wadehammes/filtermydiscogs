import type { TrackDjMetadata } from "src/types/trackMetadata.types";

export const formatDjMetadataPrimary = (
  metadata: TrackDjMetadata | null | undefined,
): string | null => {
  if (!metadata?.bpm) {
    return null;
  }

  return String(metadata.bpm);
};

export const formatDjMetadataSecondary = (
  metadata: TrackDjMetadata | null | undefined,
): string | null => {
  const key = metadata?.key?.trim();

  if (!key) {
    return null;
  }

  return key;
};

export const formatDjMetadataLine = (
  metadata: TrackDjMetadata | null | undefined,
): string | null => {
  const bpm = formatDjMetadataPrimary(metadata);
  const key = formatDjMetadataSecondary(metadata);

  if (bpm && key) {
    return `${bpm} · ${key}`;
  }

  if (bpm) {
    return bpm;
  }

  if (key) {
    return key;
  }

  return null;
};
