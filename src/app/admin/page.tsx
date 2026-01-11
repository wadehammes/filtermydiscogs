import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyAdminUser } from "src/lib/admin-helpers";

const AdminDashboardClient = dynamic(
  () => import("src/components/AdminDashboard/AdminDashboardClient.component"),
  {
    loading: () => null,
  },
);

export const metadata: Metadata = {
  title: "Admin Dashboard | FilterMyDisco.gs",
  description: "Admin statistics and analytics dashboard.",
};

export default async function AdminPage() {
  const cookieStore = await cookies();

  // Get OAuth tokens from cookies (httpOnly, so harder to tamper with)
  const accessToken = cookieStore.get("discogs_access_token")?.value;
  const accessTokenSecret = cookieStore.get(
    "discogs_access_token_secret",
  )?.value;

  // Securely verify admin status by verifying identity with Discogs API
  // This prevents cookie tampering attacks
  const isAdmin = await verifyAdminUser(accessToken, accessTokenSecret);

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminDashboardClient />;
}
