import type { Metadata } from "next";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "src/components/AdminDashboard/AdminDashboardClient.component";
import {
  PAGE_DESCRIPTIONS,
  PRIVATE_PAGE_ROBOTS,
  sitePageTitle,
} from "src/constants/siteMetadata";
import { verifyAdminUser } from "src/lib/admin-helpers";

export const metadata: Metadata = {
  title: sitePageTitle("Admin Dashboard"),
  description: PAGE_DESCRIPTIONS.admin,
  robots: PRIVATE_PAGE_ROBOTS,
};

export default async function AdminPage() {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get("discogs_access_token")?.value;
  const accessTokenSecret = cookieStore.get(
    "discogs_access_token_secret",
  )?.value;

  const isAdmin = await verifyAdminUser(accessToken, accessTokenSecret);

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminDashboardClient />;
}
