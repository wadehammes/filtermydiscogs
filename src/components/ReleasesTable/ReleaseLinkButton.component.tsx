"use client";

import { memo, useMemo } from "react";
import { trackEvent } from "src/analytics/analytics";
import type { DiscogsRelease } from "src/types";
import styles from "./ReleasesTable.module.css";

interface ReleaseLinkButtonProps {
  release: DiscogsRelease;
}

export const ReleaseLinkButton = memo<ReleaseLinkButtonProps>(({ release }) => {
  const releaseUrl = useMemo(() => {
    const resourceUrl = release.basic_information.resource_url;
    if (!resourceUrl) return null;
    const id = resourceUrl.split("/").pop();
    return id ? `https://www.discogs.com/release/${id}` : null;
  }, [release.basic_information.resource_url]);

  if (!releaseUrl) {
    return null;
  }

  return (
    <a
      href={releaseUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.discogsButton}
      onClick={() => {
        trackEvent("releaseClicked", {
          action: "releaseClicked",
          category: "releasesTable",
          label: "Release Clicked (Table View)",
          value: release.basic_information.resource_url,
        });
      }}
      aria-label="View on Discogs"
    >
      View
    </a>
  );
});

ReleaseLinkButton.displayName = "ReleaseLinkButton";
