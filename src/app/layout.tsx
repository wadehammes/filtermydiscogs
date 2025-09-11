import type { Metadata, Viewport } from "next";
import { Providers } from "src/components/Providers";
import "../styles/global.css";
import { GoogleTagManager } from "@next/third-parties/google";

export const metadata: Metadata = {
  title: "Filter My Disco.gs - a Discogs collection management tool",
  description: "a Discogs collection management tool",
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
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Assistant:wght@300;400;600;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: because
          dangerouslySetInnerHTML={{
            __html: `
              // Initialize performance monitoring
              if (typeof window !== 'undefined') {
                import('/src/utils/performance.ts').then(({ performanceMonitor }) => {
                  window.performanceMonitor = performanceMonitor;
                }).catch(() => {
                  // Silently fail if performance monitoring fails to load
                });
              }
            `,
          }}
        />
      </head>
      <body>
        <noscript>
          <iframe
            title="googletagmanager"
            src="https://www.googletagmanager.com/ns.html?id=GTM-NCP5CSG"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        <Providers>{children}</Providers>
        <GoogleTagManager gtmId="GTM-NCP5CSG" />
      </body>
    </html>
  );
}
