import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";

const DashboardClient = dynamic(
  () => import("src/components/Dashboard/DashboardClient.component"),
  {
    loading: () => (
      <AppPageLoading currentPage="dashboard" hideFilters={true} />
    ),
  },
);

export const metadata: Metadata = {
  title: "Dashboard | FilterMyDisco.gs",
  description: "View analytics and insights about your Discogs collection.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
