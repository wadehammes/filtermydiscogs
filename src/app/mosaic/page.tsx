import type { Metadata } from "next";
import MosaicClient from "src/components/MosaicClient/MosaicClient.component";

export const metadata: Metadata = {
  title: "Mosaic | FilterMyDisco.gs",
  description: "Create a mosaic of your Discogs collection.",
};

export default function MosaicPage() {
  return <MosaicClient />;
}
