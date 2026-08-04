import type { Metadata } from "next";
import { Suspense } from "react";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PageLoader } from "src/components/PageLoader/PageLoader.component";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import {
  getMetadataSiteUrl,
  PAGE_DESCRIPTIONS,
  SITE_NAME,
  sitePageTitle,
} from "src/constants/siteMetadata";
import { fetchPublicCrateMetadata } from "src/lib/api-helpers";
import { getPublicCrateIdsForStaticGeneration } from "src/lib/public-crate.server";
import { PublicCrateClient } from "./PublicCrateClient";

export async function generateStaticParams() {
  const ids = await getPublicCrateIdsForStaticGeneration();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const baseUrl = getMetadataSiteUrl();
  const crateUrl = `${baseUrl}/crate/${id}`;
  const ogImageUrl = new URL(`/api/og/crate/${id}`, baseUrl).href;

  const data = await fetchPublicCrateMetadata(id);

  if (data) {
    const crateName = data.crate.name;
    const releaseCount = data.pagination.total;
    const username = data.crate.username;
    const description = username
      ? `Public crate "${crateName}" by ${username} with ${releaseCount} release${releaseCount !== 1 ? "s" : ""} on ${SITE_NAME}`
      : `Public crate "${crateName}" with ${releaseCount} release${releaseCount !== 1 ? "s" : ""} on ${SITE_NAME}`;

    return {
      title: `${crateName}${username ? ` by ${username}` : ""} | ${SITE_NAME}`,
      description,
      openGraph: {
        title: `${crateName}${username ? ` by ${username}` : ""}`,
        description,
        url: crateUrl,
        siteName: SITE_NAME,
        type: "website",
        locale: "en-US",
        images: [
          {
            url: ogImageUrl,
            width: 1200,
            height: 630,
            alt: `Public crate: ${crateName}`,
          },
        ],
      },
      twitter: {
        card: "summary_large_image",
        title: `${crateName}${username ? ` by ${username}` : ""}`,
        description,
        images: [
          {
            url: ogImageUrl,
            alt: `Public crate: ${crateName}`,
          },
        ],
      },
    };
  }

  const fallbackTitle = sitePageTitle("Crate");
  const fallbackDescription = PAGE_DESCRIPTIONS.crateFallback;

  return {
    title: fallbackTitle,
    description: fallbackDescription,
    openGraph: {
      title: fallbackTitle,
      description: fallbackDescription,
      url: crateUrl,
      siteName: SITE_NAME,
      type: "website",
      locale: "en-US",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: "Image of Crate Releases",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fallbackTitle,
      description: fallbackDescription,
      images: [
        {
          url: ogImageUrl,
          alt: "Image of Crate Releases",
        },
      ],
    },
  };
}

async function PublicCratePageContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PublicCrateClient crateId={id} />;
}

export default function PublicCratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <PublicAuthLayout footer={<PageFooter />}>
      <Suspense fallback={<PageLoader />}>
        <PublicCratePageContent params={params} />
      </Suspense>
    </PublicAuthLayout>
  );
}
