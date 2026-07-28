import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";

const SettingsClient = dynamic(
  () => import("src/components/Settings/SettingsClient.component"),
  {
    loading: () => <AppPageLoading currentPage="settings" hideFilters={true} />,
  },
);

export const metadata: Metadata = {
  title: "Settings | FilterMyDisco.gs",
  description:
    "Manage your Filter My Discogs account settings and preferences.",
};

export default function SettingsPage() {
  return <SettingsClient />;
}
