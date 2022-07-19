import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import Script from "next/script";
import { addDataLayer } from "src/analytics/analytics";
import { ServerStyleSheet } from "styled-components";

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: (App) => (props) =>
            sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        styles: [initialProps.styles, sheet.getStyleElement()],
      };
    } finally {
      sheet.seal();
    }
  }

  render() {
    return (
      <Html>
        <Head>
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
          <Script
            id="polyfillio"
            type="text/javascript"
            strategy="beforeInteractive"
            src="https://polyfill.io/v3/polyfill.min.js?features=ResizeObserver%2CIntl.RelativeTimeFormat%2CIntl%2Cdefault%2Cwindow.scroll%2CIntersectionObserver%2CIntersectionObserverEntry%2CIntl.DateTimeFormat%2CIntl.DateTimeFormat.prototype.formatToParts%2CIntl.DisplayNames%2CIntl.ListFormat%2CIntl.Locale%2CIntl.NumberFormat%2CIntl.PluralRules%2CIntl.getCanonicalLocales"
          />
          <Script id="addDatalayer" strategy="beforeInteractive">
            {addDataLayer()}
          </Script>
          <Script id="gtm" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
          new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
          j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
          'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
          })(window,document,'script','dataLayer','GTM-NCP5CSG')`}
          </Script>
        </Head>
        <body>
          <noscript>
            <iframe
              title="googletagmanager"
              src="https://www.googletagmanager.com/ns.html?id=GTM-NCP5CSG"
              height="0"
              width="0"
              style={{ display: "none", visibility: "hidden" }}
            ></iframe>
          </noscript>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
