import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const instant = false;

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
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function DashboardPage() {
  return <DashboardClient />;
}
