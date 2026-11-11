import type { Metadata } from "next";
import DashboardClient from "src/components/Dashboard/DashboardClient.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const metadata: Metadata = {
  title: sitePageTitle("Dashboard"),
  description: PAGE_DESCRIPTIONS.dashboard,
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function DashboardPage() {
  return <DashboardClient />;
}
