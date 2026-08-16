import { io } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminDashboardClient from "src/components/AdminDashboard/AdminDashboardClient.component";
import { verifyAdminFromCookies } from "src/lib/admin-helpers";

export async function AdminDashboardGate() {
  await io();

  const cookieStore = await cookies();
  const isAdmin = await verifyAdminFromCookies(cookieStore);

  if (!isAdmin) {
    redirect("/");
  }

  return <AdminDashboardClient />;
}
