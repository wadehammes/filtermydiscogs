import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";

const ReleasesClient = dynamic(
  () => import("src/components/ReleasesClient/ReleasesClient.component"),
  {
    loading: () => <AppPageLoading currentPage="releases" />,
  },
);

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";

export const metadata: Metadata = {
  title: "Releases | FilterMyDisco.gs",
  description:
    "Filter and sort your Discogs collection and build a crate as you browse.",
  openGraph: {
    title: "Releases | FilterMyDisco.gs",
    description:
      "Filter and sort your Discogs collection and build a crate as you browse.",
    url: `${baseUrl}/releases`,
    siteName: "FilterMyDisco.gs",
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Releases | FilterMyDisco.gs",
    description:
      "Filter and sort your Discogs collection and build a crate as you browse.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function ReleasesPage() {
  return <ReleasesClient />;
}
