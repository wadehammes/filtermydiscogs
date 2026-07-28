import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import { PAGE_DESCRIPTIONS, sitePageTitle } from "src/constants/siteMetadata";

const SettingsClient = dynamic(
  () => import("src/components/Settings/SettingsClient.component"),
  {
    loading: () => <AppPageLoading currentPage="settings" hideFilters={true} />,
  },
);

export const metadata: Metadata = {
  title: sitePageTitle("Settings"),
  description: PAGE_DESCRIPTIONS.settings,
};

export default function SettingsPage() {
  return <SettingsClient />;
}
