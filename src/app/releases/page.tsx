import type { Metadata } from "next";
import ReleasesClient from "src/components/ReleasesClient/ReleasesClient.component";

export const metadata: Metadata = {
  title: "Releases | FilterMyDisco.gs",
  description:
    "Filter and sort your Discogs collection and build a crate as you browse.",
};

export default function ReleasesPage() {
  return <ReleasesClient />;
}
