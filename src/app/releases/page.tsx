import type { Metadata } from "next";
import dynamic from "next/dynamic";

// Dynamically import ReleasesClient to reduce initial bundle size
// This component includes table, grid, and filtering logic
const ReleasesClient = dynamic(
  () => import("src/components/ReleasesClient/ReleasesClient.component"),
  {
    // Use null to let Next.js use the loading.tsx file for route-level loading
    // The loading.tsx will show while the route is loading
    loading: () => null,
  },
);

export const metadata: Metadata = {
  title: "Releases | FilterMyDisco.gs",
  description:
    "Filter and sort your Discogs collection and build a crate as you browse.",
};

export default function ReleasesPage() {
  return <ReleasesClient />;
}
