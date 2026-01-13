import type { Metadata } from "next";
import HomeClient from "src/components/HomeClient/HomeClient.component";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";

export const metadata: Metadata = {
  title: "FilterMyDisco.gs - A Discogs collection management tool",
  description:
    "View, filter and sort your Discogs collection and build a crate as you browse",
  openGraph: {
    title: "FilterMyDisco.gs - A Discogs collection management tool",
    description:
      "View, filter and sort your Discogs collection and build a crate as you browse",
    url: baseUrl,
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
    title: "FilterMyDisco.gs - A Discogs collection management tool",
    description:
      "View, filter and sort your Discogs collection and build a crate as you browse",
    images: ["/opengraph-image.png"],
  },
};

export default function Home() {
  return <HomeClient />;
}
