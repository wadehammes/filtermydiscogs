import type { Metadata } from "next";
import { fetchPublicCrateMetadata } from "src/lib/api-helpers";
import { PublicCrateClient } from "./PublicCrateClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";
  const crateUrl = `${baseUrl}/crate/${id}`;

  const data = await fetchPublicCrateMetadata(id);

  if (data) {
    const crateName = data.crate.name;
    const releaseCount = data.pagination.total;
    const username = data.crate.username;
    const description = username
      ? `Public crate "${crateName}" by ${username} with ${releaseCount} release${releaseCount !== 1 ? "s" : ""} on FilterMyDisco.gs`
      : `Public crate "${crateName}" with ${releaseCount} release${releaseCount !== 1 ? "s" : ""} on FilterMyDisco.gs`;

    return {
      title: `${crateName}${username ? ` by ${username}` : ""} | FilterMyDisco.gs`,
      description,
      openGraph: {
        title: `${crateName}${username ? ` by ${username}` : ""}`,
        description,
        url: crateUrl,
        type: "website",
        siteName: "FilterMyDisco.gs",
        images: [
          {
            url: `/crate/${id}/opengraph-image.png`,
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
        images: [`/crate/${id}/opengraph-image.png`],
      },
    };
  }

  return {
    title: "Crate | FilterMyDisco.gs",
    description: "A public crate on FilterMyDisco.gs",
    openGraph: {
      title: "Crate | FilterMyDisco.gs",
      description: "A public crate on FilterMyDisco.gs",
      url: crateUrl,
      type: "website",
      images: [
        {
          url: `/crate/${id}/opengraph-image.png`,
          width: 1200,
          height: 630,
          alt: "Image of Crate Releases",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "Crate | FilterMyDisco.gs",
      description: "Public crate on FilterMyDisco.gs",
      images: [`/crate/${id}/opengraph-image.png`],
    },
  };
}

export default async function PublicCratePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return <PublicCrateClient crateId={id} />;
}
