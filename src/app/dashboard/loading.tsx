"use client";

import { AppPageLoading } from "src/components/AppPageLoading/AppPageLoading.component";

export default function DashboardLoadingPage() {
  return <AppPageLoading currentPage="dashboard" hideFilters={true} />;
}
