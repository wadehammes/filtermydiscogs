"use client";

import Link from "next/link";
import Button from "src/components/Button/Button.component";
import PageLoader from "src/components/PageLoader/PageLoader.component";
import { PublicPageHeader } from "src/components/PublicPageHeader/PublicPageHeader.component";
import { ReleaseCardGrid } from "src/components/ReleaseCardGrid/ReleaseCardGrid.component";
import { usePublicCrateQuery } from "src/hooks/queries/usePublicCrateQuery";
import { formatDate } from "src/utils/dateHelpers";
import styles from "./page.module.css";

interface PublicCrateClientProps {
  crateId: string;
}

export function PublicCrateClient({ crateId }: PublicCrateClientProps) {
  const { data, isLoading, isError, error } = usePublicCrateQuery(crateId);

  if (isLoading) {
    return (
      <>
        <PublicPageHeader />
        <div className={styles.container}>
          <div className={styles.content}>
            <PageLoader message="Loading crate..." />
          </div>
        </div>
      </>
    );
  }

  if (isError || !data) {
    const errorMessage =
      error instanceof Error ? error.message : "Failed to load crate";

    return (
      <>
        <PublicPageHeader />
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
            <section className={styles.section}>
              <h2 className={styles.heading}>About FilterMyDiscogs</h2>
              <p className={styles.text}>
                FilterMyDisco.gs is a passion project to help you discover,
                organize, and explore your music collection—whether it's vinyl,
                CDs, cassettes, or digital releases.
              </p>
              <p className={styles.text}>Key features:</p>
              <ul className={styles.list}>
                <li className={styles.listItem}>
                  <strong>Browse and filter your collection</strong> —
                  rediscover your favorite albums and artists
                </li>
                <li className={styles.listItem}>
                  <strong>Create and manage crates</strong> — perfect for DJ
                  gigs, organizing by theme, or tracking favorites
                </li>
                <li className={styles.listItem}>
                  <strong>Generate mosaic grids</strong> — different formats and
                  sizes; perfect for social sharing
                </li>
                <li className={styles.listItem}>
                  <strong>Share public crates</strong> — make your crates public
                  and share them with others
                </li>
              </ul>
              <p className={styles.text}>
                <Link href="/about" className={styles.inlineLink}>
                  Learn more about FilterMyDisco.gs
                </Link>
              </p>
            </section>
          </div>
        </div>
      </>
    );
  }

  const { crate, releases, pagination } = data;

  if (!pagination) {
    throw new Error("Pagination data is missing");
  }

  // Type assertion needed until Prisma client is regenerated after migration
  const crateWithUsername = crate as typeof crate & {
    username?: string | null;
  };

  return (
    <>
      <PublicPageHeader />
      <div className={styles.container}>
        <div className={styles.content}>
          {crateWithUsername.username && (
            <div className={styles.notice}>
              <p className={styles.noticeText}>
                You are viewing a public crate for {crateWithUsername.username}
              </p>
            </div>
          )}
          <div className={styles.section}>
            <h1 className={styles.title}>{crate.name}</h1>
            <div className={styles.meta}>
              {crateWithUsername.username && (
                <>
                  By {crateWithUsername.username}
                  {" — "}
                </>
              )}
              {pagination.total} release{pagination.total !== 1 ? "s" : ""}
              <div className={styles.metaContainer}>
                {crate.created_at && (
                  <span>Created {formatDate(String(crate.created_at))}</span>
                )}
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
              <ReleaseCardGrid releases={releases} />
            </div>
          ) : (
            <div className={styles.section}>
              <p className={styles.text}>This crate is empty.</p>
            </div>
          )}

          <section className={`${styles.section} ${styles.aboutSection}`}>
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
                    <strong>Collection analytics</strong> — discover your
                    collection milestones, style evolution over time, growth
                    trends, and more with beautiful visualizations
                  </li>
                  <li className={styles.listItem}>
                    <strong>Browse and filter your collection</strong> —
                    rediscover your favorite albums and artists
                  </li>
                  <li className={styles.listItem}>
                    <strong>Create and manage crates</strong> — perfect for DJ
                    gigs, organizing by theme, or tracking favorites
                  </li>
                  <li className={styles.listItem}>
                    <strong>Generate mosaic grids</strong> — different formats
                    and sizes; perfect for social sharing
                  </li>
                  <li className={styles.listItem}>
                    <strong>Share public crates</strong> — make your crates
                    public and share them with others
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
                  <Button
                    variant="primary"
                    size="lg"
                    onPress={() => {
                      window.location.href = "/api/auth/discogs";
                    }}
                    className={styles.connectButton}
                  >
                    Connect your Discogs
                  </Button>
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
      </div>
    </>
  );
}
