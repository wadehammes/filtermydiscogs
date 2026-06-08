import type { Metadata } from "next";
import { Login } from "src/components/Login/Login.component";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";

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
        url: "/opengraph-image",
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
    images: ["/opengraph-image"],
  },
};

export default function Home() {
  return (
    <PublicAuthLayout centerMain currentPage="home" footer={<PageFooter />}>
      <Login />
    </PublicAuthLayout>
  );
}
