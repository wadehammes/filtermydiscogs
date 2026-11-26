"use client";

import classNames from "classnames";
import Image from "next/image";
import { type CSSProperties, useCallback, useState } from "react";
import skeletonPulseStyles from "src/styles/modules/skeleton-pulse.module.css";
import { hasReleaseCoverImageUrl } from "src/utils/releaseAlbumCover";
import styles from "./ReleaseCardCoverMedia.module.css";

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
  const [isLoaded, setIsLoaded] = useState(false);
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

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
    <span className={styles.mediaFrame}>
      {!isLoaded ? (
        <span
          className={classNames(
            skeletonPulseStyles.pulsesurface,
            placeholderClassName,
            styles.coverPlaceholderLayer,
          )}
          aria-hidden
        />
      ) : null}
      <Image
        key={thumbUrl}
        src={thumbUrl}
        height={sizePx}
        width={sizePx}
        quality={85}
        alt={title}
        onLoad={handleLoad}
        {...(priority
          ? { priority: true, loading: "eager" as const }
          : { loading: "lazy" as const })}
        className={classNames(
          styles.coverImage,
          imageClassName,
          isLoaded ? styles.loaded : undefined,
        )}
        {...(imageStyle ? { style: imageStyle } : {})}
        sizes={sizes}
      />
    </span>
  );
};
