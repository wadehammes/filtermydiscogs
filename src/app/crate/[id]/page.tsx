import type { Metadata } from "next";
import { fetchPublicCrateMetadata } from "src/lib/api-helpers";
import { PublicCrateClient } from "./PublicCrateClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;

  const data = await fetchPublicCrateMetadata(id);

  if (data) {
    return {
      title: `${data.crate.name} | FilterMyDisco.gs`,
      description: `Public crate: ${data.crate.name} with ${data.pagination.total} release${data.pagination.total !== 1 ? "s" : ""}`,
    };
  }

  return {
    title: "Crate | FilterMyDisco.gs",
    description: "View a public crate on FilterMyDisco.gs",
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
