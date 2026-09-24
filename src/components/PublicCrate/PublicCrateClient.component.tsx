"use client";

import classNames from "classnames";
import Link from "next/link";
import { useMemo } from "react";
import { LoginConnectButton } from "src/components/LoginConnectButton/LoginConnectButton.component";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PlaybackScrollSpacer } from "src/components/PlaybackScrollSpacer/PlaybackScrollSpacer.component";
import { PublicReleaseModal } from "src/components/PublicReleaseModal/PublicReleaseModal.component";
import { ReleaseCardGrid } from "src/components/ReleaseCardGrid/ReleaseCardGrid.component";
import { PUBLIC_CRATE_MARKETING_BULLETS } from "src/constants/marketingPublicCopy";
import { SITE_LEAD } from "src/constants/siteMetadata";
import { useAuth } from "src/context/auth.context";
import { useRegisterPlaybackReleaseClick } from "src/context/playbackReleaseClick.context";
import { usePublicCrateQuery } from "src/hooks/queries/usePublicCrateQuery";
import { usePublicSelectedReleaseModal } from "src/hooks/useSelectedReleaseModal.hook";
import type { DiscogsRelease } from "src/types";
import { formatDate } from "src/utils/dateHelpers";
import styles from "./PublicCrate.module.css";

interface PublicCrateClientProps {
  crateId: string;
}

type MarketingBullet = {
  label: string;
  text: string;
};

const PublicMarketingFeatureList = ({
  bullets,
}: {
  bullets: MarketingBullet[];
}) => {
  return (
    <ul className={styles.list}>
      {bullets.map((bullet) => (
        <li key={bullet.label} className={styles.listItem}>
          <strong>{bullet.label}</strong>: {bullet.text}
        </li>
      ))}
    </ul>
  );
};

const PublicCrateAboutSections = () => {
  return (
    <section className={styles.section}>
      <h2 className={styles.heading}>About FilterMyDiscogs</h2>
      <p className={styles.text}>{SITE_LEAD}</p>
      <p className={styles.text}>Key features:</p>
      <PublicMarketingFeatureList
        bullets={[...PUBLIC_CRATE_MARKETING_BULLETS]}
      />
      <p className={styles.text}>
        <Link href="/about" className={styles.inlineLink}>
          Learn more about FilterMyDisco.gs
        </Link>
      </p>
    </section>
  );
};

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
  const { login } = useAuth();
  const { selectedRelease, handleReleaseClick, handleCloseModal } =
    usePublicSelectedReleaseModal({ fallbackReleases: releases });

  useRegisterPlaybackReleaseClick(handleReleaseClick);

  if (!pagination) {
    throw new Error("Pagination data is missing");
  }

  return (
    <>
      <div className={styles.container}>
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
                <p className={styles.text}>{SITE_LEAD}</p>
                <p className={styles.text}>Key features:</p>
                <PublicMarketingFeatureList
                  bullets={[...PUBLIC_CRATE_MARKETING_BULLETS]}
                />
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
  const { data, isPending, isError, error } = usePublicCrateQuery({ crateId });

  const releases = useMemo(
    () => data?.releases.map((item) => item.release) ?? [],
    [data?.releases],
  );

  if (isPending && !data) {
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
};

export const PublicCrateClient = ({ crateId }: PublicCrateClientProps) => {
  return (
    <div data-testid="fmdPublicCrate">
      <PublicCrateClientContent crateId={crateId} />
    </div>
  );
};
