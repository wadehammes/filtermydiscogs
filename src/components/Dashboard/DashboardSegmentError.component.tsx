"use client";

import { DiscogsExternalLink } from "src/components/DiscogsExternalLink/DiscogsExternalLink.component";
import type { DashboardSegmentErrorContent } from "src/utils/getDashboardSegmentErrorContent";
import styles from "./DashboardSegmentError.module.css";

interface DashboardSegmentErrorProps {
  content: DashboardSegmentErrorContent;
}

export const DashboardSegmentError = ({
  content,
}: DashboardSegmentErrorProps) => (
  <div className={styles.errorBlock}>
    <p className={styles.errorMessage}>{content.message}</p>
    <p className={styles.errorDetail}>
      {content.detail}
      {content.showDiscogsStatusLink ? (
        <>
          {" "}
          <DiscogsExternalLink
            href={content.statusUrl}
            variant="text"
            label="Discogs status"
          />
        </>
      ) : null}
    </p>
  </div>
);
