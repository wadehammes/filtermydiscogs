import classNames from "classnames";
import type { Metadata, Viewport } from "next";
import { Assistant, JetBrains_Mono } from "next/font/google";
import { Providers } from "src/components/Providers";
import { DEFAULT_OPEN_GRAPH_IMAGE, DEFAULT_TWITTER_IMAGE } from "src/constants";
import {
  getMetadataSiteUrl,
  SITE_DEFAULT_TITLE,
  SITE_DESCRIPTION,
  SITE_NAME,
  siteCanonicalUrl,
} from "src/constants/siteMetadata";

import "src/styles/global.css";

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
  metadataBase: new URL(getMetadataSiteUrl()),
  title: SITE_DEFAULT_TITLE,
  description: SITE_DESCRIPTION,
  alternates: {
    canonical: siteCanonicalUrl("/"),
  },
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
    type: "website",
    locale: "en-US",
    siteName: SITE_NAME,
    images: [DEFAULT_OPEN_GRAPH_IMAGE],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_DEFAULT_TITLE,
    description: SITE_DESCRIPTION,
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
      <head>
        <script src="/theme-init.js" />
      </head>
      <body suppressHydrationWarning>
        <div className="appRoot">
          <Providers>{children}</Providers>
        </div>
      </body>
    </html>
  );
}
