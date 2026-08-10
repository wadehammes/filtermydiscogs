import type { Metadata } from "next";
import { Suspense } from "react";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import CrateDetailClient from "src/components/Crates/CrateDetailClient.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const metadata: Metadata = {
  title: sitePageTitle("Crate"),
  description: PAGE_DESCRIPTIONS.cratesDetail,
  robots: PRIVATE_PAGE_ROBOTS,
};

interface CrateDetailPageProps {
  params: Promise<{ id: string }>;
}

async function CrateDetailPageContent({ params }: CrateDetailPageProps) {
  const { id } = await params;

  return <CrateDetailClient crateId={id} />;
}

export default function CrateDetailPage({ params }: CrateDetailPageProps) {
  return (
    <Suspense
      fallback={<AppPageLoading currentPage="crates" hideFilters={true} />}
    >
      <CrateDetailPageContent params={params} />
    </Suspense>
  );
}
