import type { CSSProperties } from "react";

const styleCache = new Map<string, CSSProperties>();

export const releaseCardImageContainerStyle = (
  thumbUrl: string | null,
): CSSProperties | undefined => {
  if (!thumbUrl) {
    return undefined;
  }

  const cached = styleCache.get(thumbUrl);

  if (cached) {
    return cached;
  }

  const style = {
    "--release-cover-image": `url(${thumbUrl})`,
  } as CSSProperties;

  styleCache.set(thumbUrl, style);
  return style;
};
