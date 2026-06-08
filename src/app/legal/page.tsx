import type { Metadata } from "next";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";
import { LegalClient } from "./LegalClient";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";

export const metadata: Metadata = {
  title: "Terms & Privacy | FilterMyDisco.gs",
  description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
  openGraph: {
    title: "Terms & Privacy | FilterMyDisco.gs",
    description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
    url: `${baseUrl}/legal`,
    siteName: "FilterMyDisco.gs",
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Privacy | FilterMyDisco.gs",
    description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function LegalPage() {
  return (
    <PublicAuthLayout
      authenticatedNavPage="legal"
      currentPage="legal"
      footer={<PageFooter />}
    >
      <LegalClient />
    </PublicAuthLayout>
  );
}
