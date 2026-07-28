import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { PAGE_DESCRIPTIONS, sitePageTitle } from "src/constants/siteMetadata";

const DashboardClient = dynamic(
  () => import("src/components/Dashboard/DashboardClient.component"),
  {
    loading: () => (
      <AppPageLoading currentPage="dashboard" hideFilters={true} />
    ),
  },
);

export const metadata: Metadata = {
  title: sitePageTitle("Dashboard"),
  description: PAGE_DESCRIPTIONS.dashboard,
};

export default function DashboardPage() {
  return <DashboardClient />;
}
