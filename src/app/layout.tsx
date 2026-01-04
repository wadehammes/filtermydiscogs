import { GoogleTagManager } from "@next/third-parties/google";
import type { Metadata, Viewport } from "next";
import { Assistant } from "next/font/google";
import { Providers } from "src/components/Providers";

import "src/styles/global.css";
import "src/styles/pills.css";

const assistant = Assistant({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  display: "swap",
  variable: "--font-assistant",
  preload: true,
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.filtermydisco.gs",
  ),
  title: "Filter My Disco.gs - a Discogs collection management tool",
  description: "a Discogs collection management tool",
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Filter My Disco.gs",
    description: "a Discogs collection management tool",
    type: "website",
    locale: "en-US",
    images: [
      {
        url: "/images/app-preview.png",
        width: 800,
        height: 400,
        alt: "Filter My Disco.gs App Preview",
      },
    ],
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
    <html lang="en" className={assistant.variable} suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <script
          // biome-ignore lint: Theme initialization script must run before React hydration
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('filtermydiscogs_theme') || 'system';
                  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  const resolvedTheme = theme === 'system' ? systemTheme : theme;
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
        <GoogleTagManager gtmId="GTM-NCP5CSG" />
      </body>
    </html>
  );
}
