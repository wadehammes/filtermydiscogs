"use client";

import type React from "react";
import { memo, useCallback, useEffect, useState } from "react";
import { trackEvent } from "src/analytics/analytics";
import LoadingOverlay from "src/components/LoadingOverlay/LoadingOverlay.component";
import { useDiscogsReleaseQuery } from "src/hooks/queries/useDiscogsReleaseQuery";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesTable.module.css";

interface ReleaseLinkButtonProps {
  release: DiscogsRelease;
}

export const ReleaseLinkButton = memo<ReleaseLinkButtonProps>(({ release }) => {
  const [isClicked, setIsClicked] = useState(false);
  const { data: releaseData, isLoading } = useDiscogsReleaseQuery(
    release.basic_information.resource_url.split("/").pop() || "",
    isClicked,
  );

  const handleReleaseClick = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      setIsClicked(true);

      trackEvent("releaseClicked", {
        action: "releaseClicked",
        category: "releasesTable",
        label: "Release Clicked (Table View)",
        value: release.basic_information.resource_url,
      });

      if (releaseData?.uri) {
        window.open(releaseData.uri, "_blank", "noopener,noreferrer");
        return;
      }
    },
    [releaseData?.uri, release.basic_information.resource_url],
  );

  useEffect(() => {
    if (isClicked && releaseData?.uri) {
      window.open(releaseData.uri, "_blank", "noopener,noreferrer");
      setIsClicked(false);
    }
  }, [isClicked, releaseData?.uri]);

  return (
    <>
      <button
        type="button"
        className={styles.discogsButton}
        onClick={handleReleaseClick}
        disabled={isLoading}
        aria-label="View on Discogs"
      >
        View
      </button>
      <LoadingOverlay
        message="Fetching Discogs Release URL"
        isVisible={isLoading}
      />
    </>
  );
});

ReleaseLinkButton.displayName = "ReleaseLinkButton";
