"use client";

import classNames from "classnames";
import Image from "next/image";
import type { CSSProperties } from "react";
import {
  PUBLIC_SHARE_HERO_MOSAIC_CELL_IMAGE_QUALITY,
  PUBLIC_SHARE_HERO_MOSAIC_CELL_IMAGE_SIZES,
} from "src/constants/publicShareHeroCoverImage";
import { playlistMosaicGridLayout } from "src/utils/playlistMosaic";
import styles from "./CoverArtMosaic.module.css";

export interface CoverArtMosaicProps {
  thumbUrls?: string[];
  className?: string;
  "aria-label"?: string;
}

export const CoverArtMosaic = ({
  thumbUrls = [],
  className,
  "aria-label": ariaLabel = "Cover art mosaic",
}: CoverArtMosaicProps) => {
  if (thumbUrls.length === 0) {
    return (
      <div
        className={classNames(styles.empty, className)}
        aria-label={ariaLabel}
        role="img"
        data-testid="fmdCoverArtMosaic"
      />
    );
  }

  const { cols, rows } = playlistMosaicGridLayout(thumbUrls.length);

  const mosaicGridStyle = {
    "--cover-mosaic-cols": cols,
    "--cover-mosaic-rows": rows,
  } as CSSProperties;

  return (
    <div
      className={classNames(styles.root, styles.rootFill, className)}
      role="img"
      aria-label={ariaLabel}
      data-testid="fmdCoverArtMosaic"
      style={mosaicGridStyle}
    >
      <div className={classNames(styles.grid, styles.gridFill)}>
        {thumbUrls.map((url, index) => (
          <div key={`${url}-${index}`} className={styles.cell}>
            <Image
              src={url}
              alt=""
              fill
              className={styles.image}
              sizes={PUBLIC_SHARE_HERO_MOSAIC_CELL_IMAGE_SIZES}
              quality={PUBLIC_SHARE_HERO_MOSAIC_CELL_IMAGE_QUALITY}
              priority={index === 0}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
