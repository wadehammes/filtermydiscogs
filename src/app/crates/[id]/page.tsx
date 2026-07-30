import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

const CrateDetailClient = dynamic(
  () => import("src/components/Crates/CrateDetailClient.component"),
  {
    loading: () => <AppPageLoading currentPage="crates" hideFilters={true} />,
  },
);

export const metadata: Metadata = {
  title: sitePageTitle("Crate"),
  description: PAGE_DESCRIPTIONS.cratesDetail,
  robots: PRIVATE_PAGE_ROBOTS,
};

interface CrateDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CrateDetailPage({
  params,
}: CrateDetailPageProps) {
  const { id } = await params;

  return <CrateDetailClient crateId={id} />;
}
