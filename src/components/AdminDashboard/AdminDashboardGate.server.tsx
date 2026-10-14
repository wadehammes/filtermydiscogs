import { io } from "next/dist/server/request/io";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "src/components/AdminDashboard/AdminDashboardClient.component";
import { verifyAdminFromCookies } from "src/lib/admin-helpers";
import { getPlaylistsFeatureEnabled } from "src/lib/playlistsFeature.server";

export async function AdminDashboardGate() {
  await io();

  const cookieStore = await cookies();
  const isAdmin = await verifyAdminFromCookies(cookieStore);

  if (!isAdmin) {
    redirect("/");
  }

  const playlistsFeatureEnabled = await getPlaylistsFeatureEnabled();

  return <AdminDashboardClient deployment={{ playlistsFeatureEnabled }} />;
}
