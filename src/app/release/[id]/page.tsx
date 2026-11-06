import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PageFooter } from "src/components/Page/PageFooter.server";
import { PublicAuthLayout } from "src/components/PublicAuthLayout/PublicAuthLayout.component";
import { PublicReleasePage } from "src/components/PublicReleasePage/PublicReleasePage.component";
import { isValidDiscogsReleaseIdParam } from "src/lib/fetchDiscogsReleaseRecordsSequential.server";
import { loadPublicReleaseDiscogsDetailForPage } from "src/lib/public-release-discogs-detail.server";
import {
  buildPublicReleasePageMetadata,
  getPrivateReleaseNotFoundMetadata,
  getPublicReleaseMetadataForPage,
} from "src/lib/public-release-page-metadata.server";
import { definedProps } from "src/utils/definedProps";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  if (!isValidDiscogsReleaseIdParam(id)) {
    return getPrivateReleaseNotFoundMetadata();
  }

  let resolved: Awaited<ReturnType<typeof getPublicReleaseMetadataForPage>> =
    null;

  try {
    resolved = await getPublicReleaseMetadataForPage(id);
  } catch (error) {
    console.error(`Failed to load public release metadata for ${id}:`, error);

    return getPrivateReleaseNotFoundMetadata();
  }

  if (resolved === null) {
    return getPrivateReleaseNotFoundMetadata();
  }

  return buildPublicReleasePageMetadata({ id, resolved });
}

export default async function PublicReleaseRoute({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!isValidDiscogsReleaseIdParam(id)) {
    notFound();
  }

  const initialDiscogsReleaseDetail =
    await loadPublicReleaseDiscogsDetailForPage(id);

  return (
    <PublicAuthLayout footer={<PageFooter />} omitMainLandmark>
      <PublicReleasePage
        releaseId={id}
        {...definedProps({
          initialDiscogsReleaseDetail: initialDiscogsReleaseDetail ?? undefined,
        })}
      />
    </PublicAuthLayout>
  );
}
