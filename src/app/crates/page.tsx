import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

const CratesClient = dynamic(
  () => import("src/components/Crates/CratesClient.component"),
  {
    loading: () => <AppPageLoading currentPage="crates" hideFilters={true} />,
  },
);

export const metadata: Metadata = {
  title: sitePageTitle("Crates"),
  description: PAGE_DESCRIPTIONS.crates,
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function CratesPage() {
  return <CratesClient />;
}
