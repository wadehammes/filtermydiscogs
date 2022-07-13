import Head from "next/head";
import { FC, useEffect, useState } from "react";

export const Helmet: FC = () => {
  const [pageUrl, setPageUrl] = useState<Location | null>(null);

  useEffect(() => {
    // Need to capture window.location in useEffect since this is in SSR
    // Used for hreflang meta tag
    setPageUrl(window.location);
  }, []);

  return (
    <Head>
      <title>FilterMyDisco.gs - a Discogs collection management tool</title>
      <link rel="icon" type="image/x-icon" href="/favicon.ico"></link>
      <meta name="viewport" content="width=device-width, minimum-scale=1.0" />
      <meta
        name="description"
        content="FilterMyDisco.gs - a Discogs collection management tool"
      />
      <meta
        property="og:description"
        content="FilterMyDisco.gs - a Discogs collection management tool"
      />
      <meta
        property="og:image"
        content="https://filtermydisco.gs/images/app-ui.png"
      />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:creator" content="@nthoftype" />
      <meta property="og:locale" content="en-US" />
      {pageUrl && (
        <>
          <meta
            property="og:url"
            content={`${pageUrl.origin}${pageUrl.pathname}`}
          />
          <link rel="canonical" href={`${pageUrl.origin}${pageUrl.pathname}`} />
        </>
      )}
    </Head>
  );
};
