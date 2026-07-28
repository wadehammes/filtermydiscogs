import { homeStructuredData } from "src/constants/siteMetadata";

export const HomeJsonLd = () => {
  const structuredData = homeStructuredData();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
