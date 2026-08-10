import type { Metadata } from "next";
import CratesClient from "src/components/Crates/CratesClient.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const metadata: Metadata = {
  title: sitePageTitle("Crates"),
  description: PAGE_DESCRIPTIONS.crates,
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function CratesPage() {
  return <CratesClient />;
}
