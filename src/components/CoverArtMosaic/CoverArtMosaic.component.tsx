"use client";

import classNames from "classnames";
import Image from "next/image";
import { playlistMosaicGridLayout } from "src/utils/playlistMosaic";
import styles from "./CoverArtMosaic.module.css";

export type CoverArtMosaicLayout = "fixed" | "fill";

export interface CoverArtMosaicProps {
  thumbUrls?: string[];
  className?: string;
  layout?: CoverArtMosaicLayout;
  maxDisplaySize?: number;
  "aria-label"?: string;
}

export const CoverArtMosaic = ({
  thumbUrls = [],
  className,
  layout = "fixed",
  maxDisplaySize = 280,
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

  const { cols, rows, cellSize } = playlistMosaicGridLayout(thumbUrls.length);

  if (layout === "fill") {
    return (
      <div
        className={classNames(styles.root, styles.rootFill, className)}
        role="img"
        aria-label={ariaLabel}
        data-testid="fmdCoverArtMosaic"
        style={{
          ["--cover-mosaic-cols" as string]: cols,
          ["--cover-mosaic-rows" as string]: rows,
        }}
      >
        <div className={classNames(styles.grid, styles.gridFill)}>
          {thumbUrls.map((url, index) => (
            <div key={`${url}-${index}`} className={styles.cell}>
              <Image
                src={url}
                alt=""
                fill
                className={styles.image}
                sizes="(width >= 1024px) 256px, (width >= 768px) 144px, 88px"
                priority={index === 0}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const gridWidth = cols * cellSize;
  const gridHeight = rows * cellSize;
  const displayCellSize = Math.max(
    8,
    Math.floor(
      Math.min(maxDisplaySize / gridWidth, maxDisplaySize / gridHeight) *
        cellSize,
    ),
  );
  const displayWidth = cols * displayCellSize;
  const displayHeight = rows * displayCellSize;

  return (
    <div
      className={classNames(styles.root, className)}
      role="img"
      aria-label={ariaLabel}
      data-testid="fmdCoverArtMosaic"
      style={{
        width: displayWidth,
        height: displayHeight,
      }}
    >
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `repeat(${cols}, ${displayCellSize}px)`,
          gridTemplateRows: `repeat(${rows}, ${displayCellSize}px)`,
          width: displayWidth,
          height: displayHeight,
        }}
      >
        {thumbUrls.map((url, index) => (
          <div key={`${url}-${index}`} className={styles.cell}>
            <Image
              src={url}
              alt=""
              width={displayCellSize}
              height={displayCellSize}
              className={styles.image}
              sizes={`${displayCellSize}px`}
            />
          </div>
        ))}
      </div>
    </div>
  );
};
