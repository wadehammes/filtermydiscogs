"use client";

import classNames from "classnames";
import Link from "next/link";
import { useMemo } from "react";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { ReleaseCardGrid } from "src/components/ReleaseCardGrid/ReleaseCardGrid.component";
import { PublicReleaseModal } from "src/components/ReleaseModal/PublicReleaseModal.component";
import { ReleaseMiniPlayer } from "src/components/ReleasePlayback/ReleaseMiniPlayer.component";
import { COLLECTION_FORMATS_PHRASE } from "src/constants/siteMetadata";
import { useAuth } from "src/context/auth.context";
import {
  ReleasePlaybackProvider,
  useReleasePlayback,
} from "src/context/releasePlayback.context";
import { usePublicCrateQuery } from "src/hooks/queries/usePublicCrateQuery";
import { useSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import type { DiscogsRelease } from "src/types";
import { formatDate } from "src/utils/dateHelpers";
import { definedProps } from "src/utils/definedProps";
import styles from "./page.module.css";

interface PublicCrateClientProps {
  crateId: string;
}

function PublicCrateAboutSections() {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>About FilterMyDiscogs</h2>
      <p className={styles.text}>
        FilterMyDisco.gs is a passion project to help you discover, organize,
        and explore your music collection, including {COLLECTION_FORMATS_PHRASE}
        .
      </p>
      <p className={styles.text}>Key features:</p>
      <ul className={styles.list}>
        <li className={styles.listItem}>
          <strong>Browse and filter your collection</strong>: rediscover your
          favorite albums and artists
        </li>
        <li className={styles.listItem}>
          <strong>Create and manage crates</strong>: perfect for DJ gigs,
          organizing by theme, or tracking favorites
        </li>
        <li className={styles.listItem}>
          <strong>Generate mosaic grids</strong>: different formats and sizes;
          perfect for social sharing
        </li>
        <li className={styles.listItem}>
          <strong>Share public crates</strong>: make your crates public and
          share them with others
        </li>
      </ul>
      <p className={styles.text}>
        <Link href="/about" className={styles.inlineLink}>
          Learn more about FilterMyDisco.gs
        </Link>
      </p>
    </section>
  );
}

function PublicCrateLoadedContent({
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
}) {
  const { login } = useAuth();
  const { isPlaying } = useReleasePlayback();
  const {
    selectedRelease,
    selectedReleaseId,
    handleReleaseClick,
    handleCloseModal,
  } = useSelectedReleaseModal(releases);

  if (!pagination) {
    throw new Error("Pagination data is missing");
  }

  return (
    <div
      className={classNames(styles.container, {
        [styles.withMiniPlayer]: isPlaying,
      })}
    >
      <div className={styles.content}>
        {crate.username ? (
          <div className={styles.notice}>
            <p className={styles.noticeText}>
              You are viewing a public crate for {crate.username}
            </p>
          </div>
        ) : null}
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
          {crate.notes?.trim() ? (
            <p className={styles.notes}>{crate.notes}</p>
          ) : null}
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

        <section className={classNames(styles.section, styles.aboutSection)}>
          <div className={styles.twoColumnLayout}>
            <div className={styles.aboutContent}>
              <h2 className={styles.heading}>About FilterMyDiscogs</h2>
              <p className={styles.text}>
                FilterMyDisco.gs is a passion project to help you better and
                more effectively discover, organize, and explore your
                collection.
              </p>
              <p className={styles.text}>Key features:</p>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <strong>Collection analytics</strong>: discover your
                  collection milestones, style evolution over time, growth
                  trends, and more with beautiful visualizations
                </li>
                <li className={styles.listItem}>
                  <strong>Browse and filter your collection</strong>: rediscover
                  your favorite albums and artists
                </li>
                <li className={styles.listItem}>
                  <strong>Create and manage crates</strong>: perfect for DJ
                  gigs, organizing by theme, or tracking favorites
                </li>
                <li className={styles.listItem}>
                  <strong>Generate mosaic grids</strong>: different formats and
                  sizes; perfect for social sharing
                </li>
                <li className={styles.listItem}>
                  <strong>Share public crates</strong>: make your crates public
                  and share them with others
                </li>
              </ul>
              <p className={styles.text}>
                <Link href="/about" className={styles.inlineLink}>
                  Learn more
                </Link>
              </p>
            </div>

            <div className={styles.loginModule}>
              <h2 className={styles.heading}>Get Started</h2>
              <p className={styles.text}>
                Connect your Discogs account to start exploring and organizing
                your collection.
              </p>
              <div className={styles.loginButtonContainer}>
                <LoginConnectButton
                  onClick={login}
                  className={styles.connectButton}
                />
              </div>
              <p className={styles.loginNote}>
                <Link href="/legal" className={styles.inlineLink}>
                  Terms & Privacy
                </Link>
              </p>
            </div>
          </div>
        </section>
      </div>

      <PublicReleaseModal
        isOpen={selectedReleaseId !== null}
        release={selectedRelease}
        onClose={handleCloseModal}
      />
      <ReleaseMiniPlayer
        {...definedProps({ onReleaseClick: handleReleaseClick })}
      />
    </div>
  );
}

function PublicCrateClientContent({ crateId }: PublicCrateClientProps) {
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
          <PublicCrateAboutSections />
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
}

export function PublicCrateClient({ crateId }: PublicCrateClientProps) {
  return (
    <ReleasePlaybackProvider>
      <PublicCrateClientContent crateId={crateId} />
    </ReleasePlaybackProvider>
  );
}
