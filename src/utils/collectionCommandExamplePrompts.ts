import {
  COLLECTION_COMMAND_EXAMPLE_PROMPT_MAX_LENGTH,
  COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK,
} from "src/constants/collectionCommand.constants";
import { SortSecondaryValues, SortValues } from "src/constants/sortValues";
import type { DiscogsRelease } from "src/types";
import type {
  FacetOptions,
  PersistedFiltersJson,
} from "src/types/filters.types";
import { listCollectionCommandMatchedReleases } from "src/utils/collectionCommandPreview";
import { buildCollectionCommandViewNameFromFilters } from "src/utils/collectionCommandViewName";
import { getAppliedFilterCount } from "src/utils/getAppliedFilterCount";

const EXAMPLE_PROMPT_COUNT = 3;

const baseProbeFilters = (): PersistedFiltersJson => ({
  selectedStyles: [],
  excludedStyles: [],
  selectedYears: [],
  selectedFormats: [],
  selectedSort: SortValues.DateAddedNew,
  selectedSortSecondary: SortSecondaryValues.None,
  styleOperator: "OR",
  formatOperator: "OR",
  yearOperator: "OR",
  searchQuery: "",
});

const formatDecadePhrase = (decadeStart: number): string => {
  if (decadeStart >= 2000 || decadeStart % 100 === 0) {
    return `the ${decadeStart}s`;
  }

  return `the ${decadeStart % 100}s`;
};

const formatTagList = (tags: readonly string[], max = 2): string | null => {
  const trimmed = tags
    .map((tag) => tag.trim())
    .filter((tag) => tag.length > 0)
    .slice(0, max);

  if (trimmed.length === 0) {
    return null;
  }

  if (trimmed.length === 1) {
    return trimmed[0] ?? null;
  }

  return `${trimmed[0]} and ${trimmed[1]}`;
};

const formatYearPhrase = (years: readonly number[]): string | null => {
  if (years.length === 0) {
    return null;
  }

  const sorted = [...years].sort((left, right) => left - right);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  if (first === undefined || last === undefined) {
    return null;
  }

  if (sorted.length === 1) {
    return `from ${first}`;
  }

  const decadeStart = Math.floor(first / 10) * 10;
  const inSameDecade = sorted.every(
    (year) => year >= decadeStart && year < decadeStart + 10,
  );

  if (inSameDecade) {
    return formatDecadePhrase(decadeStart);
  }

  if (sorted.length <= 3) {
    return `${sorted.join(", ")}`;
  }

  return `${first}–${last}`;
};

const pickDominantDecadeYear = (years: readonly number[]): number | null => {
  if (years.length === 0) {
    return null;
  }

  const counts = new Map<number, number>();
  for (const year of years) {
    const decade = Math.floor(year / 10) * 10;
    counts.set(decade, (counts.get(decade) ?? 0) + 1);
  }

  let bestDecade: number | null = null;
  let bestCount = 0;
  for (const [decade, count] of counts) {
    if (count > bestCount) {
      bestCount = count;
      bestDecade = decade;
    }
  }

  return bestDecade;
};

const pickDominantDecadeLabel = (years: readonly number[]): string | null => {
  const bestDecade = pickDominantDecadeYear(years);
  return bestDecade === null ? null : formatDecadePhrase(bestDecade);
};

const pickExampleDecadeLabel = (years: readonly number[]): string | null => {
  const bestDecade = pickDominantDecadeYear(years);
  return bestDecade === null ? null : `the ${bestDecade}s`;
};

const describeActiveFilterSet = (
  filters: PersistedFiltersJson,
): string | null => {
  const segments: string[] = [];

  const styles = formatTagList(filters.selectedStyles);
  if (styles) {
    segments.push(styles);
  }

  const formats = formatTagList(filters.selectedFormats);
  if (formats) {
    segments.push(formats);
  }

  const yearPhrase = formatYearPhrase(filters.selectedYears);
  if (yearPhrase) {
    segments.push(
      yearPhrase.startsWith("the ") ? yearPhrase : `from ${yearPhrase}`,
    );
  }

  const searchQuery = filters.searchQuery.trim();
  if (searchQuery.length > 0) {
    segments.push(`matching "${searchQuery}"`);
  }

  if (segments.length === 0) {
    return null;
  }

  return segments.join(", ");
};

const pickLeadFormat = (
  facetOptions: FacetOptions,
  shuffleSeed = 0,
): string | null => {
  const formats = facetOptions.availableFormats;
  if (formats.length === 0) {
    return null;
  }

  const vinylFirst = [
    ...formats.filter((format) => format === "Vinyl"),
    ...formats.filter((format) => format !== "Vinyl"),
  ];

  const index = shuffleSeed % vinylFirst.length;
  return vinylFirst[index] ?? formats[0] ?? null;
};

const pickSecondaryStyle = (facetOptions: FacetOptions): string | null =>
  facetOptions.availableStyles[1] ??
  facetOptions.availableStyles.find(
    (style) => style !== facetOptions.availableStyles[0],
  ) ??
  null;

const hashFacetStyleSampleSeed = (
  styles: readonly string[],
  shuffleSeed = 0,
): number => {
  let hash = 2_166_136_261 ^ shuffleSeed;
  for (const style of styles) {
    for (let index = 0; index < style.length; index += 1) {
      hash ^= style.charCodeAt(index);
      hash = Math.imul(hash, 16_777_619);
    }
    hash ^= 0;
    hash = Math.imul(hash, 16_777_619);
  }

  return hash >>> 0;
};

const seededShuffle = <T>(items: readonly T[], seed: number): T[] => {
  const shuffled = [...items];
  let state = seed;

  const nextUnit = () => {
    state = Math.imul(1_664_525, state) + 1_013_904_223;
    return (state >>> 0) / 4_294_967_296;
  };

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(nextUnit() * (index + 1));
    const left = shuffled[index];
    const right = shuffled[swapIndex];
    if (left !== undefined && right !== undefined) {
      shuffled[index] = right;
      shuffled[swapIndex] = left;
    }
  }

  return shuffled;
};

const uniqueFacetStyles = (availableStyles: readonly string[]): string[] => [
  ...new Set(
    availableStyles
      .map((style) => style.trim())
      .filter((style) => style.length > 0),
  ),
];

export const sampleDistinctFacetStyles = (
  availableStyles: readonly string[],
  count: number,
  shuffleSeed = 0,
): string[] => {
  const unique = uniqueFacetStyles(availableStyles);
  if (unique.length === 0 || count <= 0) {
    return [];
  }

  const shuffled = seededShuffle(
    unique,
    hashFacetStyleSampleSeed(unique, shuffleSeed),
  );
  return shuffled.slice(0, Math.min(count, unique.length));
};

type IdleExampleStyleSlots = {
  explorePrimary: string | null;
  exploreSecondary: string | null;
  savePrimary: string | null;
  cratePrimary: string | null;
};

const countFacetProbeMatches = (
  releases: readonly DiscogsRelease[] | undefined,
  filters: PersistedFiltersJson,
): number | null => {
  if (!releases || releases.length === 0) {
    return null;
  }

  return listCollectionCommandMatchedReleases({ releases, filters }).length;
};

const isStyleViableForExample = (
  style: string,
  format: string | null,
  releases: readonly DiscogsRelease[] | undefined,
): boolean => {
  const styleCount = countFacetProbeMatches(releases, {
    ...baseProbeFilters(),
    selectedStyles: [style],
  });

  if (styleCount === null) {
    return true;
  }

  if (styleCount === 0) {
    return false;
  }

  if (!format) {
    return true;
  }

  const styleAndFormatCount = countFacetProbeMatches(releases, {
    ...baseProbeFilters(),
    selectedStyles: [style],
    selectedFormats: [format],
  });

  if (styleAndFormatCount === null) {
    return true;
  }

  return styleAndFormatCount > 0;
};

const assignDistinctIdleStyleSlots = (
  facetOptions: FacetOptions,
  releases: readonly DiscogsRelease[] | undefined,
  shuffleSeed: number,
): IdleExampleStyleSlots => {
  const format = pickLeadFormat(facetOptions, shuffleSeed);
  const stylePool = sampleDistinctFacetStyles(
    facetOptions.availableStyles,
    Math.min(12, uniqueFacetStyles(facetOptions.availableStyles).length),
    shuffleSeed,
  );

  const distinct: string[] = [];
  for (const style of stylePool) {
    if (distinct.includes(style)) {
      continue;
    }

    if (!isStyleViableForExample(style, format, releases)) {
      continue;
    }

    distinct.push(style);
    if (distinct.length >= 3) {
      break;
    }
  }

  const explorePrimary = distinct[0] ?? null;
  const savePrimary = distinct[1] ?? distinct[0] ?? null;
  const cratePrimary = distinct[2] ?? distinct[1] ?? distinct[0] ?? null;
  const exploreSecondary =
    distinct.find((style) => style !== explorePrimary) ?? explorePrimary;

  return {
    explorePrimary,
    exploreSecondary,
    savePrimary,
    cratePrimary,
  };
};

const exampleShelfName = (filters: PersistedFiltersJson): string =>
  buildCollectionCommandViewNameFromFilters({ filters }) ?? "This shelf";

const pickExampleYear = (
  years: readonly number[],
  shuffleSeed: number,
): number | null => {
  const sorted = [...years]
    .filter((year) => Number.isFinite(year) && year > 0)
    .sort((left, right) => left - right);

  if (sorted.length === 0) {
    return null;
  }

  return sorted[shuffleSeed % sorted.length] ?? null;
};

const pushUnique = (prompts: string[], candidate: string | null) => {
  if (!candidate) {
    return;
  }

  const normalized = candidate.trim();
  if (
    normalized.length === 0 ||
    normalized.length > COLLECTION_COMMAND_EXAMPLE_PROMPT_MAX_LENGTH ||
    prompts.includes(normalized)
  ) {
    return;
  }

  prompts.push(normalized);
};

const appendFallbackPrompts = (prompts: string[]) => {
  for (const fallback of COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK) {
    if (prompts.length >= EXAMPLE_PROMPT_COUNT) {
      break;
    }

    pushUnique(prompts, fallback);
  }
};

const buildRefinePrompt = ({
  filters,
  facetOptions,
  shuffleSeed,
}: {
  filters: PersistedFiltersJson;
  facetOptions: FacetOptions;
  descriptor: string;
  shuffleSeed: number;
}): string | null => {
  const searchQuery = filters.searchQuery.trim();
  const leadFormat = pickLeadFormat(facetOptions, shuffleSeed);
  const leadStyle = facetOptions.availableStyles[0];
  const secondaryStyle = pickSecondaryStyle(facetOptions);
  const decade = pickDominantDecadeLabel(facetOptions.availableYears);

  if (searchQuery.length > 0 && leadStyle && leadFormat) {
    return `Keep "${searchQuery}" matches on ${leadFormat} only`;
  }

  if (filters.selectedFormats.length === 0 && leadFormat) {
    return `Limit what's showing to ${leadFormat} only`;
  }

  if (filters.selectedYears.length === 0 && decade) {
    const styles = formatTagList(filters.selectedStyles) ?? leadStyle;
    if (styles) {
      return `Keep ${styles} and limit to ${decade}`;
    }
  }

  if (secondaryStyle) {
    return `Add ${secondaryStyle} to what's showing`;
  }

  return `Sort what's showing by year, oldest first`;
};

const buildSaveViewPrompt = (
  filters: PersistedFiltersJson,
  _descriptor: string,
): string | null => {
  const name = exampleShelfName(filters);
  return `Save a view named "${name}" from what's showing`;
};

const buildCratePrompt = (
  filters: PersistedFiltersJson,
  _descriptor: string,
): string | null => {
  const name = exampleShelfName(filters);
  return `Create a crate named "${name}" from what's showing`;
};

const buildExplorePrompt = (
  facetOptions: FacetOptions,
  styles: IdleExampleStyleSlots,
  shuffleSeed: number,
): string | null => {
  const leadStyle = styles.explorePrimary;
  const secondaryStyle = styles.exploreSecondary;
  const leadFormat = pickLeadFormat(facetOptions, shuffleSeed);
  const exampleYear = pickExampleYear(facetOptions.availableYears, shuffleSeed);
  const exampleDecade = pickExampleDecadeLabel(facetOptions.availableYears);
  const decade = pickDominantDecadeLabel(facetOptions.availableYears);
  const variant = shuffleSeed % 3;

  if (
    leadStyle &&
    secondaryStyle &&
    leadStyle !== secondaryStyle &&
    exampleDecade
  ) {
    const complex = `Show me ${leadStyle} AND ${secondaryStyle} releases from ${exampleDecade}`;
    if (complex.length <= COLLECTION_COMMAND_EXAMPLE_PROMPT_MAX_LENGTH) {
      return complex;
    }
  }

  if (leadStyle && exampleYear) {
    return `Show me ${leadStyle} from ${exampleYear}`;
  }

  if (variant === 0 && leadStyle && leadFormat) {
    return `Show me ${leadStyle} on ${leadFormat} only`;
  }

  const decadePhrase = exampleDecade ?? decade;

  if (variant === 1 && leadStyle && decadePhrase) {
    return `Show me ${leadStyle} from ${decadePhrase}`;
  }

  if (
    variant === 2 &&
    leadStyle &&
    secondaryStyle &&
    leadStyle !== secondaryStyle
  ) {
    return `Show me ${leadStyle} and ${secondaryStyle}`;
  }

  if (leadStyle) {
    return `Show me ${leadStyle} only`;
  }

  if (leadFormat) {
    return `Show me ${leadFormat} only`;
  }

  return null;
};

const buildIdleSaveViewPrompt = (
  styles: IdleExampleStyleSlots,
): string | null => {
  const leadStyle = styles.savePrimary;

  if (leadStyle) {
    return `Save a view for ${leadStyle}`;
  }

  return null;
};

const buildIdleCratePrompt = (
  facetOptions: FacetOptions,
  styles: IdleExampleStyleSlots,
  shuffleSeed: number,
): string | null => {
  const leadStyle = styles.cratePrimary;
  const leadFormat = pickLeadFormat(facetOptions, shuffleSeed + 2);

  if (leadStyle && leadFormat && shuffleSeed % 2 === 0) {
    return `Crate ${leadStyle} on ${leadFormat}`;
  }

  if (leadStyle) {
    return `Create a crate from ${leadStyle}`;
  }

  return null;
};

export const buildCollectionCommandExamplePrompts = ({
  filters,
  facetOptions,
  releases,
  shuffleSeed = 0,
}: {
  filters: PersistedFiltersJson;
  facetOptions: FacetOptions;
  releases?: readonly DiscogsRelease[];
  shuffleSeed?: number;
}): string[] => {
  const prompts: string[] = [];
  const appliedFilterCount = getAppliedFilterCount(filters);
  const descriptor = describeActiveFilterSet(filters);

  if (appliedFilterCount > 0 && descriptor) {
    pushUnique(
      prompts,
      buildRefinePrompt({ filters, facetOptions, descriptor, shuffleSeed }),
    );
    pushUnique(prompts, buildSaveViewPrompt(filters, descriptor));
    pushUnique(prompts, buildCratePrompt(filters, descriptor));
  } else {
    const idleStyles = assignDistinctIdleStyleSlots(
      facetOptions,
      releases,
      shuffleSeed,
    );
    pushUnique(
      prompts,
      buildExplorePrompt(facetOptions, idleStyles, shuffleSeed),
    );
    pushUnique(prompts, buildIdleSaveViewPrompt(idleStyles));
    pushUnique(
      prompts,
      buildIdleCratePrompt(facetOptions, idleStyles, shuffleSeed),
    );
  }

  appendFallbackPrompts(prompts);

  return prompts.slice(0, EXAMPLE_PROMPT_COUNT);
};
