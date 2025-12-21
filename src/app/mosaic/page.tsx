import type { Metadata } from "next";
import MosaicClientWrapper from "src/components/MosaicClient/MosaicClientWrapper.component";

export const metadata: Metadata = {
  title: "Mosaic | FilterMyDisco.gs",
  description: "Create a mosaic of your Discogs collection.",
};

export default function MosaicPage() {
  return <MosaicClientWrapper />;
}
