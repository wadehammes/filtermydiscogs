import type { DiscogsFormat } from "src/types";

const FORMAT_DESCRIPTION_ALLOWLIST = new Set([
  "lp",
  "ep",
  "single",
  "maxi-single",
  "mini-album",
  "mixtape",
  "shellac",
  "flexi-disc",
  "shaped disc",
  "picture disc",
  "lathe cut",
  "minidisc",
  "reel-to-reel",
  "8-track cartridge",
  "dat",
  "box set",
]);

const FORMAT_SIZE_PATTERN = /^\d+\s*"$/;

const FORMAT_SORT_ORDER = [
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
  "Vinyl",
  "Cassette",
  "CD",
  "DVD",
  "Blu-ray",
  "VHS",
  "File",
  "Digital",
  "Box Set",
];

function normalizeFormatTag(tag: string): string {
  return tag.trim().toLowerCase();
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

  const normalized = normalizeFormatTag(trimmed);
  if (FORMAT_DESCRIPTION_ALLOWLIST.has(normalized)) {
    return true;
  }

  return FORMAT_SIZE_PATTERN.test(trimmed);
}

export function getFormatSubtypeTags(format: DiscogsFormat): string[] {
  const tags = new Set<string>();

  format.descriptions?.forEach((description) => {
    const trimmed = description.trim();
    if (trimmed && isFilterableDescription(trimmed)) {
      tags.add(trimmed);
    }
  });

  return sortFormatTags(Array.from(tags));
}

export function getFormatTagsFromFormat(format: DiscogsFormat): string[] {
  const tags = new Set<string>();

  if (format.name?.trim()) {
    tags.add(format.name.trim());
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
  return [...tags].sort((left, right) => {
    const leftIndex = FORMAT_SORT_ORDER.findIndex(
      (value) => normalizeFormatTag(value) === normalizeFormatTag(left),
    );
    const rightIndex = FORMAT_SORT_ORDER.findIndex(
      (value) => normalizeFormatTag(value) === normalizeFormatTag(right),
    );
    const leftOrder = leftIndex === -1 ? Number.MAX_SAFE_INTEGER : leftIndex;
    const rightOrder = rightIndex === -1 ? Number.MAX_SAFE_INTEGER : rightIndex;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.localeCompare(right, undefined, { sensitivity: "base" });
  });
}

export function releaseMatchesFormatFilters(
  formats: DiscogsFormat[],
  selectedFormats: readonly string[],
  normalizedSelectedFormats?: ReadonlySet<string>,
  releaseFormatTags?: readonly string[],
): boolean {
  if (selectedFormats.length === 0) {
    return true;
  }

  const selectedFormatsSet =
    normalizedSelectedFormats ??
    new Set(selectedFormats.map((format) => normalizeFormatTag(format)));
  const releaseTags = releaseFormatTags ?? getReleaseFormatTags(formats);

  return releaseTags.some((tag) =>
    selectedFormatsSet.has(normalizeFormatTag(tag)),
  );
}
