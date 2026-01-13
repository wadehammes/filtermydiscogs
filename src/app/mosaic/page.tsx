import type { Metadata } from "next";
import MosaicClientWrapper from "src/components/MosaicClient/MosaicClientWrapper.component";

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
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "FilterMyDisco.gs App Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mosaic | FilterMyDisco.gs",
    description: "Create a mosaic of your Discogs collection.",
    images: ["/opengraph-image.png"],
  },
};

export default function MosaicPage() {
  return <MosaicClientWrapper />;
}
