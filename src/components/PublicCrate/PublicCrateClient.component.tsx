"use client";

import Link from "next/link";
import { useMemo } from "react";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PlaybackScrollSpacer } from "src/components/PlaybackScrollSpacer/PlaybackScrollSpacer.component";
import { PublicReleaseModal } from "src/components/PublicReleaseModal/PublicReleaseModal.component";
import { PublicSharedViewBanner } from "src/components/PublicSharedViewBanner/PublicSharedViewBanner.component";
import { PublicShareMarketingSection } from "src/components/PublicShareMarketingSection/PublicShareMarketingSection.component";
import { PublicSharePlaybackShell } from "src/components/PublicSharePlaybackShell/PublicSharePlaybackShell.component";
import { ReleaseCardGrid } from "src/components/ReleaseCardGrid/ReleaseCardGrid.component";
import { PUBLIC_SHARED_CRATE_MAIN_LABEL } from "src/constants/accessibilityLabels.constants";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { usePublicCrateQuery } from "src/hooks/queries/usePublicCrateQuery";
import { usePublicSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import type { DiscogsRelease } from "src/types";
import { formatDate } from "src/utils/dateHelpers";
import styles from "./PublicCrate.module.css";

interface PublicCrateClientProps {
  crateId: string;
}

const PublicCrateLoadedContent = ({
  crate,
  releases,
  pagination,
}: {
  crate: NonNullable<
    ReturnType<typeof usePublicCrateQuery>["data"]
  >["crate"] & {
    username?: string | null;
  };
  releases: DiscogsRelease[];
  pagination: NonNullable<
    ReturnType<typeof usePublicCrateQuery>["data"]
  >["pagination"];
}) => {
  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    usePublicSelectedReleaseModal({ fallbackReleases: releases });

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  if (!pagination) {
    throw new Error("Pagination data is missing");
  }

  return (
    <>
      <PublicSharedViewBanner kind="crate" username={crate.username} />
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.publicShareStack}>
            <div className={styles.section}>
              <h1 className={styles.title}>{crate.name}</h1>
              <div className={styles.meta}>
                {crate.username ? (
                  <>
                    By {crate.username}
                    {" · "}
                  </>
                ) : null}
                {pagination.total} release{pagination.total !== 1 ? "s" : ""}
                <div className={styles.metaContainer}>
                  {crate.created_at ? (
                    <span>Created {formatDate(String(crate.created_at))}</span>
                  ) : null}
                  {crate.updated_at &&
                    new Date(crate.updated_at).getTime() !==
                      new Date(crate.created_at).getTime() && (
                      <time dateTime={String(crate.updated_at)}>
                        Updated {formatDate(String(crate.updated_at))}
                      </time>
                    )}
                </div>
              </div>
            </div>

            {releases.length > 0 ? (
              <div className={styles.section}>
                <ReleaseCardGrid
                  releases={releases}
                  onReleaseClick={handleReleaseClick}
                />
              </div>
            ) : (
              <div className={styles.section}>
                <p className={styles.text}>This crate is empty.</p>
              </div>
            )}

            <PublicShareMarketingSection />
          </div>
          <PlaybackScrollSpacer />
        </div>
      </div>
      <PublicReleaseModal
        isOpen={selectedRelease !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
    </>
  );
};

const PublicCrateClientContent = ({ crateId }: PublicCrateClientProps) => {
  const { data, isLoading, isError, error } = usePublicCrateQuery({ crateId });

  const releases = useMemo(
    () => data?.releases.map((item) => item.release) ?? [],
    [data?.releases],
  );

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <PageLoader message="Loading crate..." />
        </div>
      </div>
    );
  }

  if (isError || !data) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load crate";

    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.section}>
            <h2 className={styles.heading}>Crate Not Found</h2>
            <p className={styles.text}>
              {errorMessage.includes("private")
                ? "This crate is private and cannot be viewed."
                : "This crate doesn't exist or has been removed."}
            </p>
            <p className={styles.text}>
              <Link href="/" className={styles.inlineLink}>
                Return to home
              </Link>
            </p>
          </div>
          <PublicShareMarketingSection />
        </div>
      </div>
    );
  }

  const { crate, pagination } = data;
  const crateWithUsername = crate as typeof crate & {
    username?: string | null;
  };

  return (
    <PublicCrateLoadedContent
      crate={crateWithUsername}
      releases={releases}
      pagination={pagination}
    />
  );
};

export const PublicCrateClient = ({ crateId }: PublicCrateClientProps) => {
  return (
    <main
      data-testid="fmdPublicCrate"
      aria-label={PUBLIC_SHARED_CRATE_MAIN_LABEL}
    >
      <PublicSharePlaybackShell>
        <PublicCrateClientContent crateId={crateId} />
      </PublicSharePlaybackShell>
    </main>
  );
};
