import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { PublicCrateClient } from "src/components/PublicCrate/PublicCrateClient.component";
import { fetchPublicCrateMetadata } from "src/lib/api-helpers";
import {
  getPublicCrateIdsForStaticGeneration,
  getPublicCrateMetadataForPage,
  PUBLIC_CRATE_BUILD_PRERENDER_LIMIT,
} from "src/lib/public-crate.server";
import {
  getE2eDemoPublicShareMetadataResolved,
  shouldNotFoundPublicSharePage,
} from "src/lib/public-share-e2e.server";
import { buildPublicSharePageMetadata } from "src/lib/public-share-metadata.server";

export async function generateStaticParams() {
  const ids = await getPublicCrateIdsForStaticGeneration(
    PUBLIC_CRATE_BUILD_PRERENDER_LIMIT,
  );
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  let data: Awaited<ReturnType<typeof fetchPublicCrateMetadata>> = null;

  try {
    data = await fetchPublicCrateMetadata(id);
  } catch (error) {
    console.error(`Failed to load public crate metadata for ${id}:`, error);
  }

  const resolved =
    data !== null
      ? {
          name: data.crate.name,
          username: data.crate.username,
          itemCount: data.pagination.total,
        }
      : getE2eDemoPublicShareMetadataResolved("crate", id);

  if (resolved === null) {
    notFound();
  }

  return buildPublicSharePageMetadata({
    kind: "crate",
    id,
    resolved,
  });
}

export default async function PublicCratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const publicCrate = await getPublicCrateMetadataForPage(id);

  if (
    shouldNotFoundPublicSharePage({
      kind: "crate",
      id,
      hasServerPayload: publicCrate !== null,
    })
  ) {
    notFound();
  }

  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <PublicCrateClient crateId={id} />
    </PublicAuthLayout>
  );
}
