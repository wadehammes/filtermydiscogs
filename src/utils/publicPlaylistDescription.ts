import { PLAYLIST_PUBLIC_DESCRIPTION_META_MAX_LENGTH } from "src/constants/publicPlaylist.constants";

export const normalizePlaylistPublicDescriptionForStorage = (
  value: string,
): string | null => {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : null;
};

const truncateWithEllipsis = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) {
    return text;
  }

  if (maxLength <= 1) {
    return "…";
  }

  return `${text.slice(0, maxLength - 1).trimEnd()}…`;
};

export const resolvePlaylistPublicShareMetaDescription = (
  publicDescription: string | null | undefined,
  fallback: () => string,
): string => {
  const normalized = publicDescription?.trim() ?? "";

  if (!normalized) {
    return fallback();
  }

  return truncateWithEllipsis(
    normalized,
    PLAYLIST_PUBLIC_DESCRIPTION_META_MAX_LENGTH,
  );
};
