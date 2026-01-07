"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import styles from "./MosaicClient.module.css";

interface MosaicItemProps {
  release: DiscogsRelease;
  totalReleases: number;
}

export default function MosaicItem({
  release,
  totalReleases,
}: MosaicItemProps) {
  const [isClicked, setIsClicked] = useState(false);
  const { resource_url } = release.basic_information;

  const releaseId = resource_url.split("/").pop() || "";
  const fallbackUri = `https://www.discogs.com/release/${releaseId}`;

  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    releaseId,
    isClicked,
  );

  const handleReleaseClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsClicked(true);

      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "mosaic",
        label: "Release Clicked (Mosaic)",
        value: resource_url,
      });

      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }
    },
    [releaseData?.uri, resource_url],
  );

  const handleUrlOpen = useCallback(() => {
    if (releaseData?.uri) {
      window.open(releaseData.uri, "_blank", "noopener,noreferrer");
    } else if (!isLoading) {
      window.open(fallbackUri, "_blank", "noopener,noreferrer");
    }
  }, [releaseData?.uri, isLoading, fallbackUri]);

  useEffect(() => {
    if (isClicked && releaseData?.uri) {
      handleUrlOpen();
      setIsClicked(false);
    }
  }, [isClicked, releaseData?.uri, handleUrlOpen]);

  const imageUrl =
    totalReleases > 150
      ? release.basic_information.thumb ||
        release.basic_information.cover_image ||
        "https://placehold.jp/effbf2/000/100x100.png?text=%F0%9F%98%B5"
      : release.basic_information.cover_image ||
        release.basic_information.thumb ||
        "https://placehold.jp/effbf2/000/100x100.png?text=%F0%9F%98%B5";

  return (
    <button
      type="button"
      className={styles.mosaicItem}
      onClick={handleReleaseClick}
      aria-label={`View ${release.basic_information.title} on Discogs`}
      data-release-id={release.instance_id}
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
      {isLoading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.loadingSpinner}></div>
        </div>
      )}
    </button>
  );
}
