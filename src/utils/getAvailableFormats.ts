import type { DiscogsRelease } from "src/types";

export const getAvailableFormats = (releases: DiscogsRelease[]): string[] => {
  const formatSet = new Set<string>();

  releases.forEach((release) => {
    const formats = release.basic_information.formats;
    formats.forEach((format) => {
      if (format?.name?.trim()) {
        formatSet.add(format.name);
      }
    });
  });

  return Array.from(formatSet).sort();
};
