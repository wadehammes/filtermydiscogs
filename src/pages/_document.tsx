import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import Script from "next/script";
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
          ></link>
          <Script
            id="polyfillio"
            type="text/javascript"
            strategy="beforeInteractive"
            src="https://polyfill.io/v3/polyfill.min.js?features=ResizeObserver%2CIntl.RelativeTimeFormat%2CIntl%2Cdefault%2Cwindow.scroll%2CIntersectionObserver%2CIntersectionObserverEntry%2CIntl.DateTimeFormat%2CIntl.DateTimeFormat.prototype.formatToParts%2CIntl.DisplayNames%2CIntl.ListFormat%2CIntl.Locale%2CIntl.NumberFormat%2CIntl.PluralRules%2CIntl.getCanonicalLocales"
          />
          <Script
            id="gtm"
            strategy="beforeInteractive"
            src="https://www.googletagmanager.com/gtag/js?id=G-WK4TL04HL0"
          />
          <Script
            id="gtag"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());

              gtag('config', 'G-WK4TL04HL0');
            `,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
