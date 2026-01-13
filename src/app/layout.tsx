import { GoogleTagManager } from "@next/third-parties/google";
import classNames from "classnames";
import type { Metadata, Viewport } from "next";
import { Assistant, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
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
    images: [
      {
        url: "/images/app-preview.png",
        width: 800,
        height: 400,
        alt: "FilterMyDisco.gs App Preview",
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
    <html
      lang="en"
      className={classNames(assistant.variable, jetbrainsMono.variable)}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          // biome-ignore lint: Theme initialization script must run before React hydration
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const systemTheme = prefersDark ? 'dark' : 'light';
                  const stored = localStorage.getItem('filtermydiscogs_theme');
                  let resolvedTheme = systemTheme;
                  
                  if (stored === 'light' || stored === 'dark') {
                    resolvedTheme = stored;
                  } else if (stored === 'system') {
                    localStorage.setItem('filtermydiscogs_theme', systemTheme);
                  }
                  
                  const bgColor = resolvedTheme === 'dark' ? '#121212' : '#ffffff';
                  const fgColor = resolvedTheme === 'dark' ? '#fafafa' : '#171717';
                  document.documentElement.setAttribute('data-theme', resolvedTheme);
                  document.documentElement.style.backgroundColor = bgColor;
                  document.documentElement.style.color = fgColor;
                  
                  if (document.body) {
                    document.body.style.backgroundColor = bgColor;
                    document.body.style.color = fgColor;
                  } else {
                    const observer = new MutationObserver(function(mutations) {
                      if (document.body) {
                        document.body.style.backgroundColor = bgColor;
                        document.body.style.color = fgColor;
                        observer.disconnect();
                      }
                    });
                    observer.observe(document.documentElement, { childList: true, subtree: true });
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
        <Providers>{children}</Providers>
        <GoogleTagManager gtmId="GTM-NCP5CSG" />
      </body>
    </html>
  );
}
