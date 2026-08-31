import type { Metadata } from "next";
import { LegalPageContent } from "src/components/Legal/LegalPageContent.server";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";
import {
  getMetadataSiteUrl,
  PAGE_DESCRIPTIONS,
  SITE_NAME,
  sitePageTitle,
} from "src/constants/siteMetadata";

const baseUrl = getMetadataSiteUrl();
const title = sitePageTitle("Terms & Privacy");
const description = PAGE_DESCRIPTIONS.legal;

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title,
    description,
    url: `${baseUrl}/legal`,
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

export default function LegalPage() {
  return (
    <PublicAuthLayout
      authenticatedNavPage="legal"
      currentPage="legal"
      footer={<PageFooter />}
    >
      <LegalPageContent />
    </PublicAuthLayout>
  );
}
