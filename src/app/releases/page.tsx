import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import ReleasesClient to reduce initial bundle size
// This component includes table, grid, and filtering logic
const ReleasesClient = dynamic(
  () => import("src/components/ReleasesClient/ReleasesClient.component"),
  {
    // Use null to let Next.js use the loading.tsx file for route-level loading
    // The loading.tsx will show while the route is loading
    loading: () => null,
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
    title: "Releases | FilterMyDisco.gs",
    description:
      "Filter and sort your Discogs collection and build a crate as you browse.",
    images: ["/opengraph-image.png"],
  },
};

export default function ReleasesPage() {
  return <ReleasesClient />;
}
