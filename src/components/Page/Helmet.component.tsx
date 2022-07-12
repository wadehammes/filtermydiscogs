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
      <title>Wade Hammes | Home</title>
      <meta name="viewport" content="width=device-width, minimum-scale=1.0" />
      <meta
        name="description"
        content="Wade Hammes is a senior software engineer based in Washington, D.C., currently working for Rhythm."
      />
      <meta
        property="og:description"
        content="Wade Hammes is a senior software engineer based in Washington, D.C., currently working for Rhythm."
      />
      <meta property="og:image" content="/images/fractal.png" />
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:site" content="@nthoftype" />
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
