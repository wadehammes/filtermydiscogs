import type { Metadata } from "next";
import MosaicClientWrapper from "src/components/MosaicClient/MosaicClientWrapper.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";

export const metadata: Metadata = {
  title: "Mosaic | FilterMyDisco.gs",
  description: "Create a mosaic of your Discogs collection.",
  openGraph: {
    title: "Mosaic | FilterMyDisco.gs",
    description: "Create a mosaic of your Discogs collection.",
    url: `${baseUrl}/mosaic`,
    siteName: "FilterMyDisco.gs",
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosaic | FilterMyDisco.gs",
    description: "Create a mosaic of your Discogs collection.",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function MosaicPage() {
  return <MosaicClientWrapper />;
}
