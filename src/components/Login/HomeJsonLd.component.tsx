import { homeStructuredData } from "src/constants/siteMetadata";

export const HomeJsonLd = () => {
  const structuredData = homeStructuredData();

  return (
    <script id="home-json-ld" type="application/ld+json">
      {JSON.stringify(structuredData)}
    </script>
  );
};
