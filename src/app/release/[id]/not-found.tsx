import type { Metadata } from "next";
import Link from "next/link";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import playlistStyles from "src/components/PublicPlaylist/PublicPlaylist.module.css";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  SITE_NAME,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const metadata: Metadata = {
  title: sitePageTitle("Release not found"),
  description: PAGE_DESCRIPTIONS.releaseListenFallback,
  robots: PRIVATE_PAGE_ROBOTS,
  openGraph: {
    title: sitePageTitle("Release not found"),
    description: PAGE_DESCRIPTIONS.releaseListenFallback,
    siteName: SITE_NAME,
    type: "website",
    locale: "en-US",
  },
};

export default function PublicReleaseNotFound() {
  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <div className={playlistStyles.container}>
        <div className={playlistStyles.content}>
          <div className={playlistStyles.section}>
            <h2 className={playlistStyles.heading}>Release not found</h2>
            <p className={playlistStyles.text}>
              This release does not exist on Discogs, or the link may be wrong.
            </p>
            <p className={playlistStyles.text}>
              <Link href="/" className={playlistStyles.inlineLink}>
                Return to home
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PublicAuthLayout>
  );
}
