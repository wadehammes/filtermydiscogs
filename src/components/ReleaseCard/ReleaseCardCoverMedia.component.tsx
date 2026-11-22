import classNames from "classnames";
import Image from "next/image";
import type { CSSProperties } from "react";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import { hasReleaseCoverImageUrl } from "src/utils/releaseAlbumCover";

type ReleaseCardCoverMediaProps = {
  thumbUrl: string;
  title: string;
  sizePx: number;
  priority?: boolean;
  placeholderClassName: string;
  imageClassName?: string;
  imageStyle?: CSSProperties;
  sizes: string;
};

export const ReleaseCardCoverMedia = ({
  thumbUrl,
  title,
  sizePx,
  priority = false,
  placeholderClassName,
  imageClassName,
  imageStyle,
  sizes,
}: ReleaseCardCoverMediaProps) => {
  if (!hasReleaseCoverImageUrl(thumbUrl)) {
    return (
      <span
        className={classNames(
          skeletonPulseStyles.pulsesurface,
          placeholderClassName,
        )}
        aria-hidden
      />
    );
  }

  return (
    <Image
      key={thumbUrl}
      src={thumbUrl}
      height={sizePx}
      width={sizePx}
      quality={85}
      alt={title}
      {...(priority
        ? { priority: true, loading: "eager" as const }
        : { loading: "lazy" as const })}
      {...(imageClassName ? { className: imageClassName } : {})}
      {...(imageStyle ? { style: imageStyle } : {})}
      sizes={sizes}
    />
  );
};
