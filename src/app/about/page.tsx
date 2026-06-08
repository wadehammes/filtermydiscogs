import type { Metadata } from "next";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";
import { AboutClient } from "./AboutClient";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";

export const metadata: Metadata = {
  title: "About | FilterMyDisco.gs",
  description:
    "About FilterMyDisco.gs, contact information, and how to support the project",
  openGraph: {
    title: "About | FilterMyDisco.gs",
    description:
      "About FilterMyDisco.gs, contact information, and how to support the project",
    url: `${baseUrl}/about`,
    siteName: "FilterMyDisco.gs",
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "About | FilterMyDisco.gs",
    description:
      "About FilterMyDisco.gs, contact information, and how to support the project",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function AboutPage() {
  return (
    <PublicAuthLayout
      authenticatedNavPage="about"
      currentPage="about"
      footer={<PageFooter />}
    >
      <AboutClient />
    </PublicAuthLayout>
  );
}
