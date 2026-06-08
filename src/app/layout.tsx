import { GoogleTagManager } from "@next/third-parties/google";
import classNames from "classnames";
import type { Metadata, Viewport } from "next";
import { Assistant, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Providers } from "src/components/Providers";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";

import "src/styles/global.css";
import "src/styles/pills.css";

const assistant = Assistant({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-assistant",
  preload: true,
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-mono",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs",
  ),
  title: "FilterMyDisco.gs - a Discogs collection management tool",
  description: "a Discogs collection management tool",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "FilterMyDisco.gs",
    description: "a Discogs collection management tool",
    type: "website",
    locale: "en-US",
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    images: [DEFAULT_TWITTER_IMAGE],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  minimumScale: 1.0,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={classNames(assistant.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          src="/theme-init.js"
        />
        <Providers>{children}</Providers>
        <GoogleTagManager gtmId="GTM-NCP5CSG" />
      </body>
    </html>
  );
}
