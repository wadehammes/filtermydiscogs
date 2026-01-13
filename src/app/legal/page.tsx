import type { Metadata } from "next";
import { LegalClient } from "./LegalClient";

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs";

export const metadata: Metadata = {
  title: "Terms & Privacy | FilterMyDisco.gs",
  description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
  openGraph: {
    title: "Terms & Privacy | FilterMyDisco.gs",
    description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
    url: `${baseUrl}/legal`,
    siteName: "FilterMyDisco.gs",
    type: "website",
    locale: "en-US",
    images: [
      {
        url: "/opengraph-image.png",
        width: 1200,
        height: 630,
        alt: "FilterMyDisco.gs App Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Terms & Privacy | FilterMyDisco.gs",
    description: "Terms of Service and Privacy Policy for FilterMyDisco.gs",
    images: ["/opengraph-image.png"],
  },
};

export default function LegalPage() {
  return <LegalClient />;
}
