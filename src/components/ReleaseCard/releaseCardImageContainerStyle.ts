import type { CSSProperties } from "react";

export const releaseCardImageContainerStyle = (
  thumbUrl: string | null,
): CSSProperties | undefined => {
  if (!thumbUrl) {
    return undefined;
  }

  return {
    "--release-cover-image": `url(${thumbUrl})`,
  };
};
