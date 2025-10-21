import type { DiscogsRelease } from "src/types";

export const getAvailableStyles = (releases: DiscogsRelease[]): string[] => {
  const styleSet = new Set<string>();

  releases.forEach((release) => {
    const styles = release.basic_information.styles;
    styles.forEach((style) => {
      if (style?.trim()) {
        styleSet.add(style);
      }
    });
  });

  return Array.from(styleSet).sort();
};
