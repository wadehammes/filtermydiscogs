import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminDashboardGate } from "src/components/AdminDashboard/AdminDashboardGate.server";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";

export const metadata: Metadata = {
  title: sitePageTitle("Admin Dashboard"),
  description: PAGE_DESCRIPTIONS.admin,
  robots: PRIVATE_PAGE_ROBOTS,
};

export default function AdminPage() {
  return (
    <Suspense fallback={null}>
      <AdminDashboardGate />
    </Suspense>
  );
}
