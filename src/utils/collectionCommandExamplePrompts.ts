import { COLLECTION_COMMAND_EXAMPLE_PROMPTS_FALLBACK } from "src/constants/collectionCommand.constants";
import type {
  FacetOptions,
  PersistedFiltersJson,
} from "src/types/filters.types";
import { buildCollectionCommandViewNameFromFilters } from "src/utils/collectionCommandViewName";
import { getAppliedFilterCount } from "src/utils/getAppliedFilterCount";

const EXAMPLE_PROMPT_COUNT = 3;

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

const exampleShelfName = (filters: PersistedFiltersJson): string =>
  buildCollectionCommandViewNameFromFilters({ filters }) ?? "This shelf";

const pushUnique = (prompts: string[], candidate: string | null) => {
  if (!candidate) {
    return;
  }

  const normalized = candidate.trim();
  if (normalized.length === 0 || prompts.includes(normalized)) {
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
  descriptor,
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
    return `Start from albums matching "${searchQuery}", then keep only ${leadStyle} on ${leadFormat}`;
  }

  if (filters.selectedFormats.length === 0 && leadFormat) {
    return `Narrow what's showing (${descriptor}) to ${leadFormat} only, same styles and years`;
  }

  if (filters.selectedYears.length === 0 && decade) {
    const styles = formatTagList(filters.selectedStyles) ?? leadStyle;
    if (styles) {
      return `Keep ${styles} but limit to ${decade}, still matching the rest of this filter`;
    }
  }

  if (secondaryStyle && decade) {
    return `Keep ${descriptor}, and also fold in ${secondaryStyle} from ${decade}`;
  }

  if (secondaryStyle) {
    return `Keep ${descriptor}, but also include ${secondaryStyle} in the results`;
  }

  return `Refine ${descriptor} and sort the matches by year, oldest first`;
};

const buildSaveViewPrompt = (
  filters: PersistedFiltersJson,
  descriptor: string,
): string | null => {
  const name = exampleShelfName(filters);
  return `Save what's on screen (${descriptor}) as a view called "${name}"`;
};

const buildCratePrompt = (
  filters: PersistedFiltersJson,
  descriptor: string,
): string | null => {
  const name = exampleShelfName(filters);
  return `Create a crate from everything in this filter (${descriptor}) and name it "${name}"`;
};

const buildExplorePrompt = (facetOptions: FacetOptions): string | null => {
  const leadStyle = facetOptions.availableStyles[0];
  const secondaryStyle = pickSecondaryStyle(facetOptions);
  const leadFormat = pickLeadFormat(facetOptions);
  const decade = pickDominantDecadeLabel(facetOptions.availableYears);

  if (leadStyle && secondaryStyle && leadFormat && decade) {
    return `Show ${leadStyle} and ${secondaryStyle} on ${leadFormat} from ${decade}, sorted newest first`;
  }

  if (leadStyle && leadFormat && decade) {
    return `Filter to ${leadStyle} on ${leadFormat} from ${decade} only`;
  }

  if (leadStyle && leadFormat) {
    return `Show everything I have on ${leadFormat} tagged ${leadStyle}`;
  }

  if (leadStyle) {
    return `Show all ${leadStyle} in my collection, grouped by year`;
  }

  return null;
};

const buildIdleSaveViewPrompt = (facetOptions: FacetOptions): string | null => {
  const leadStyle = facetOptions.availableStyles[0];
  const leadFormat = pickLeadFormat(facetOptions);
  const decade = pickDominantDecadeLabel(facetOptions.availableYears);

  if (leadStyle && leadFormat && decade) {
    const name = `${leadStyle} on ${leadFormat}`;
    return `Save a view named "${name}" for ${leadStyle} on ${leadFormat} from ${decade}`;
  }

  if (leadStyle && leadFormat) {
    return `Save a view for ${leadStyle} on ${leadFormat} I reach for on weekends`;
  }

  return null;
};

const buildIdleCratePrompt = (facetOptions: FacetOptions): string | null => {
  const leadStyle = facetOptions.availableStyles[0];
  const leadFormat = pickLeadFormat(facetOptions);

  if (leadStyle && leadFormat) {
    return `Make a crate from every ${leadStyle} on ${leadFormat} in my collection, including newer adds`;
  }

  if (leadStyle) {
    return `Create a crate of my ${leadStyle} records and sort the crate list by date added`;
  }

  return null;
};

export const buildCollectionCommandExamplePrompts = ({
  filters,
  facetOptions,
}: {
  filters: PersistedFiltersJson;
  facetOptions: FacetOptions;
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
    pushUnique(prompts, buildExplorePrompt(facetOptions));
    pushUnique(prompts, buildIdleSaveViewPrompt(facetOptions));
    pushUnique(prompts, buildIdleCratePrompt(facetOptions));
  }

  appendFallbackPrompts(prompts);

  return prompts.slice(0, EXAMPLE_PROMPT_COUNT);
};
