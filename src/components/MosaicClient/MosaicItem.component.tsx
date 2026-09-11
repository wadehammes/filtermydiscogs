"use client";

import Image from "next/image";
import { useReleaseOpenHandler } from "src/hooks/useReleaseOpenHandler.hook";
import type { DiscogsRelease } from "src/types";
import { definedProps } from "src/utils/definedProps";
import { getReleaseImageUrl } from "src/utils/helpers";
import styles from "./MosaicClient.module.css";

interface MosaicItemProps {
  release: DiscogsRelease;
  totalReleases: number;
  onReleaseClick?: (instanceId: string) => void;
}

export default function MosaicItem({
  release,
  totalReleases,
  onReleaseClick,
}: MosaicItemProps) {
  const { openRelease, prefetchReleaseOpen, prefetchPointerProps, canOpen } =
    useReleaseOpenHandler({
      release,
      onReleaseClick,
    });

  const imageUrl = getReleaseImageUrl({
    thumb: release.basic_information.thumb,
    cover_image: release.basic_information.cover_image,
    width: 100,
    height: 100,
    preferCoverImage: totalReleases <= 150,
  });

  return (
    <button
      type="button"
      className={styles.mosaicItem}
      onClick={canOpen ? openRelease : undefined}
      aria-label={`Open release details for ${release.basic_information.title}`}
      data-release-id={release.instance_id}
      {...definedProps({
        ...(prefetchPointerProps ?? {}),
        ...(canOpen ? { onFocus: prefetchReleaseOpen } : {}),
      })}
    >
      <Image
        src={imageUrl}
        alt={release.basic_information.title}
        className={styles.mosaicImage}
        loading="lazy"
        width={100}
        height={100}
        sizes="100px"
      />
    </button>
  );
}
