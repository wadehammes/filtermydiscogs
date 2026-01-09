import type { Metadata } from "next";
import dynamic from "next/dynamic";

const DashboardClient = dynamic(
  () => import("src/components/Dashboard/DashboardClient.component"),
  {
    loading: () => null,
  },
);

export const metadata: Metadata = {
  title: "Dashboard | FilterMyDisco.gs",
  description: "View analytics and insights about your Discogs collection.",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
