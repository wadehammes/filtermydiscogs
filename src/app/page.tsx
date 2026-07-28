import type { Metadata } from "next";
import { HomeJsonLd } from "src/components/Login/HomeJsonLd.component";
import { Login } from "src/components/Login/Login.component";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";
import {
  getMetadataSiteUrl,
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteCanonicalUrl,
} from "src/constants/siteMetadata";

const baseUrl = getMetadataSiteUrl();

export const metadata: Metadata = {
  title: SITE_DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: siteCanonicalUrl("/"),
  },
  openGraph: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    url: baseUrl,
    siteName: SITE_NAME,
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export default function Home() {
  return (
    <>
      <HomeJsonLd />
      <PublicAuthLayout centerMain currentPage="home" footer={<PageFooter />}>
        <Login />
      </PublicAuthLayout>
    </>
  );
}
