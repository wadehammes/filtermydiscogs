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

const pickDominantDecadeLabel = (years: readonly number[]): string | null => {
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

  if (bestDecade === null) {
    return null;
  }

  return formatDecadePhrase(bestDecade);
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

const pickLeadFormat = (facetOptions: FacetOptions): string | null =>
  facetOptions.availableFormats.find((format) => format === "Vinyl") ??
  facetOptions.availableFormats[0] ??
  null;

const pickSecondaryStyle = (facetOptions: FacetOptions): string | null =>
  facetOptions.availableStyles[1] ??
  facetOptions.availableStyles.find(
    (style) => style !== facetOptions.availableStyles[0],
  ) ??
  null;

const hashFacetStyleSampleSeed = (styles: readonly string[]): number => {
  let hash = 2_166_136_261;
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
): string[] => {
  const unique = uniqueFacetStyles(availableStyles);
  if (unique.length === 0 || count <= 0) {
    return [];
  }

  const shuffled = seededShuffle(unique, hashFacetStyleSampleSeed(unique));
  return shuffled.slice(0, Math.min(count, unique.length));
};

type IdleExampleStyleSlots = {
  explorePrimary: string | null;
  exploreSecondary: string | null;
  savePrimary: string | null;
  cratePrimary: string | null;
};

const pickIdleExampleStyleSlots = (
  facetOptions: FacetOptions,
): IdleExampleStyleSlots => {
  const samples = sampleDistinctFacetStyles(facetOptions.availableStyles, 4);
  const explorePrimary = samples[0] ?? null;
  const exploreSecondary = samples[1] ?? explorePrimary;
  const savePrimary = samples[2] ?? samples[1] ?? explorePrimary;
  let cratePrimary = samples[3] ?? samples[2] ?? samples[1] ?? explorePrimary;

  if (
    savePrimary !== null &&
    cratePrimary !== null &&
    savePrimary === cratePrimary &&
    samples[1] !== undefined &&
    samples[1] !== savePrimary
  ) {
    cratePrimary = samples[1];
  }

  return {
    explorePrimary,
    exploreSecondary,
    savePrimary,
    cratePrimary,
  };
};

const exampleShelfName = (filters: PersistedFiltersJson): string =>
  buildCollectionCommandViewNameFromFilters({ filters }) ?? "This shelf";

const countFacetProbeMatches = (
  releases: readonly DiscogsRelease[] | undefined,
  filters: PersistedFiltersJson,
): number | null => {
  if (!releases || releases.length === 0) {
    return null;
  }

  return listCollectionCommandMatchedReleases({ releases, filters }).length;
};

const pickViableStyle = ({
  styleCandidates,
  format,
  releases,
}: {
  styleCandidates: readonly string[];
  format: string | null;
  releases: readonly DiscogsRelease[] | undefined;
}): string | null => {
  for (const style of styleCandidates) {
    const styleOnlyCount = countFacetProbeMatches(releases, {
      ...baseProbeFilters(),
      selectedStyles: [style],
    });

    if (styleOnlyCount === null) {
      return style;
    }

    if (styleOnlyCount === 0) {
      continue;
    }

    if (format) {
      const styleAndFormatCount = countFacetProbeMatches(releases, {
        ...baseProbeFilters(),
        selectedStyles: [style],
        selectedFormats: [format],
      });

      if (styleAndFormatCount === 0) {
        continue;
      }
    }

    return style;
  }

  return styleCandidates[0] ?? null;
};

const refineIdleExampleSlots = ({
  slots,
  facetOptions,
  releases,
}: {
  slots: IdleExampleStyleSlots;
  facetOptions: FacetOptions;
  releases: readonly DiscogsRelease[] | undefined;
}): IdleExampleStyleSlots => {
  const format = pickLeadFormat(facetOptions);
  const samples = sampleDistinctFacetStyles(facetOptions.availableStyles, 4);

  const explorePrimary = pickViableStyle({
    styleCandidates: [slots.explorePrimary, ...samples].filter(
      (style): style is string => Boolean(style),
    ),
    format,
    releases,
  });
  const exploreSecondary =
    samples.find((style) => style !== explorePrimary) ?? explorePrimary;

  const savePrimary = pickViableStyle({
    styleCandidates: [slots.savePrimary, ...samples].filter(
      (style): style is string => Boolean(style),
    ),
    format,
    releases,
  });
  const cratePrimary = pickViableStyle({
    styleCandidates: [slots.cratePrimary, ...samples].filter(
      (style): style is string => Boolean(style),
    ),
    format,
    releases,
  });

  return {
    explorePrimary,
    exploreSecondary,
    savePrimary,
    cratePrimary,
  };
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
}: {
  filters: PersistedFiltersJson;
  facetOptions: FacetOptions;
  descriptor: string;
}): string | null => {
  const searchQuery = filters.searchQuery.trim();
  const leadFormat = pickLeadFormat(facetOptions);
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
  descriptor: string,
): string | null => {
  const name = exampleShelfName(filters);
  return `Save a view named "${name}" from what's showing`;
};

const buildCratePrompt = (
  filters: PersistedFiltersJson,
  descriptor: string,
): string | null => {
  const name = exampleShelfName(filters);
  return `Create a crate named "${name}" from what's showing`;
};

const buildExplorePrompt = (
  facetOptions: FacetOptions,
  styles: IdleExampleStyleSlots,
): string | null => {
  const leadStyle = styles.explorePrimary;
  const leadFormat = pickLeadFormat(facetOptions);

  if (leadStyle && leadFormat) {
    return `Show ${leadStyle} on ${leadFormat}`;
  }

  if (leadStyle) {
    return `Show all ${leadStyle}`;
  }

  if (leadFormat) {
    return `Show everything on ${leadFormat}`;
  }

  return null;
};

const buildIdleSaveViewPrompt = (
  facetOptions: FacetOptions,
  styles: IdleExampleStyleSlots,
): string | null => {
  const leadStyle = styles.savePrimary;
  const leadFormat = pickLeadFormat(facetOptions);

  if (leadStyle && leadFormat) {
    return `Save a view for ${leadStyle} on ${leadFormat}`;
  }

  if (leadStyle) {
    return `Save a view for ${leadStyle}`;
  }

  return null;
};

const buildIdleCratePrompt = (
  facetOptions: FacetOptions,
  styles: IdleExampleStyleSlots,
): string | null => {
  const leadStyle = styles.cratePrimary;
  const leadFormat = pickLeadFormat(facetOptions);

  if (leadStyle && leadFormat) {
    return `Create a crate of ${leadStyle} on ${leadFormat}`;
  }

  if (leadStyle) {
    return `Create a crate of ${leadStyle}`;
  }

  return null;
};

export const buildCollectionCommandExamplePrompts = ({
  filters,
  facetOptions,
  releases,
}: {
  filters: PersistedFiltersJson;
  facetOptions: FacetOptions;
  releases?: readonly DiscogsRelease[];
}): string[] => {
  const prompts: string[] = [];
  const appliedFilterCount = getAppliedFilterCount(filters);
  const descriptor = describeActiveFilterSet(filters);

  if (appliedFilterCount > 0 && descriptor) {
    pushUnique(
      prompts,
      buildRefinePrompt({ filters, facetOptions, descriptor }),
    );
    pushUnique(prompts, buildSaveViewPrompt(filters, descriptor));
    pushUnique(prompts, buildCratePrompt(filters, descriptor));
  } else {
    const idleStyles = refineIdleExampleSlots({
      slots: pickIdleExampleStyleSlots(facetOptions),
      facetOptions,
      releases,
    });
    pushUnique(prompts, buildExplorePrompt(facetOptions, idleStyles));
    pushUnique(prompts, buildIdleSaveViewPrompt(facetOptions, idleStyles));
    pushUnique(prompts, buildIdleCratePrompt(facetOptions, idleStyles));
  }

  appendFallbackPrompts(prompts);

  return prompts.slice(0, EXAMPLE_PROMPT_COUNT);
};
