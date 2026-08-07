import { homeStructuredData } from "src/constants/siteMetadata";

export const HomeJsonLd = () => {
  const structuredData = homeStructuredData();

  return (
    <script
      type="application/ld+json"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD requires a script tag body
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
};
