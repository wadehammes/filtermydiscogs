import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";
import {
  getMetadataSiteUrl,
  PAGE_DESCRIPTIONS,
  SITE_NAME,
  sitePageTitle,
} from "src/constants/siteMetadata";

const ReleasesClient = dynamic(
  () => import("src/components/ReleasesClient/ReleasesClient.component"),
  {
    loading: () => <AppPageLoading currentPage="releases" />,
  },
);

const baseUrl = getMetadataSiteUrl();
const title = sitePageTitle("Releases");
const description = PAGE_DESCRIPTIONS.releases;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${baseUrl}/releases`,
    siteName: SITE_NAME,
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function ReleasesPage() {
  return <ReleasesClient />;
}
