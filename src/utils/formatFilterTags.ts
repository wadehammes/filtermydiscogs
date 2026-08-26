import type { DiscogsFormat } from "src/types";

const FORMAT_DESCRIPTION_DENYLIST = new Set(["album", "stereo", "remastered"]);

const FORMAT_CANONICAL_TAGS = [
  '12"',
  '10"',
  '7"',
  '3"',
  '2"',
  "LP",
  "EP",
  "Single",
  "Maxi-Single",
  "Mini-Album",
  "Mixtape",
  "Vinyl",
  "Cassette",
  "CD",
  "DVD",
  "Blu-ray",
  "VHS",
  "File",
  "Digital",
  "Box Set",
  "All Media",
  "Test Pressing",
  "White Label",
  "Hand-stamped",
  "Promo",
  "Acetate",
  "Advance",
  "Sampler",
  "Limited Edition",
  "Numbered",
  "Reissue",
  "Repress",
  "Compilation",
  "Mixed",
  "Partially Mixed",
  "Mispress",
  "Mono",
  "Club Edition",
  "Transcription",
  "Tour Recording",
  "Unofficial Release",
  "Partially Unofficial",
  "Picture Disc",
  "Shaped Disc",
  "Lathe Cut",
  "Flexi-disc",
  "Shellac",
  "Minidisc",
  "Reel-to-Reel",
  "8-Track Cartridge",
  "DAT",
  "Enhanced",
  "HDCD",
  "SACD",
  "DVD-Video",
];

export function normalizeFormatTag(tag: string): string {
  return tag.trim().toLowerCase();
}

function getCanonicalFormatTag(tag: string): string {
  const trimmed = tag.trim();
  if (!trimmed) {
    return trimmed;
  }

  const canonical = FORMAT_CANONICAL_TAGS.find(
    (value) => normalizeFormatTag(value) === normalizeFormatTag(trimmed),
  );

  return canonical ?? trimmed;
}

export function buildNormalizedFormatFilterSet(
  selectedFormats: readonly string[],
): ReadonlySet<string> {
  return new Set(selectedFormats.map((format) => normalizeFormatTag(format)));
}

function isFilterableDescription(description: string): boolean {
  const trimmed = description.trim();
  if (!trimmed) {
    return false;
  }

  return !FORMAT_DESCRIPTION_DENYLIST.has(normalizeFormatTag(trimmed));
}

export function getFormatSubtypeTags(format: DiscogsFormat): string[] {
  const tags = new Set<string>();

  format.descriptions?.forEach((description) => {
    const trimmed = description.trim();
    if (trimmed && isFilterableDescription(trimmed)) {
      tags.add(getCanonicalFormatTag(trimmed));
    }
  });

  return Array.from(tags);
}

export function getFormatTagsFromFormat(format: DiscogsFormat): string[] {
  const tags = new Set<string>();

  if (format.name?.trim()) {
    tags.add(getCanonicalFormatTag(format.name.trim()));
  }

  getFormatSubtypeTags(format).forEach((tag) => {
    tags.add(tag);
  });

  return Array.from(tags);
}

export function getReleaseFormatTags(formats: DiscogsFormat[]): string[] {
  const tags = new Set<string>();

  formats.forEach((format) => {
    getFormatTagsFromFormat(format).forEach((tag) => {
      tags.add(tag);
    });
  });

  return sortFormatTags(Array.from(tags));
}

export function sortFormatTags(tags: string[]): string[] {
  return [...tags].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" }),
  );
}
