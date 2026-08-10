import type { Metadata } from "next";
import SettingsClient from "src/components/Settings/SettingsClient.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const metadata: Metadata = {
  title: sitePageTitle("Settings"),
  description: PAGE_DESCRIPTIONS.settings,
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function SettingsPage() {
  return <SettingsClient />;
}
