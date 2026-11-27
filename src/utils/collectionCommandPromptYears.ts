import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";

export type CollectionCommandPromptYearBounds = {
  yearStartInclusive: number;
  yearEndExclusive: number;
};

const NUMBER_WORDS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const parseCountToken = (token: string): number | null => {
  const trimmed = token.trim().toLowerCase();
  if (/^\d+$/.test(trimmed)) {
    const value = Number.parseInt(trimmed, 10);
    return value > 0 ? value : null;
  }

  return NUMBER_WORDS[trimmed] ?? null;
};

const boundsForSpanEndingCurrentYear = (
  currentYear: number,
  spanYears: number,
): CollectionCommandPromptYearBounds => ({
  yearStartInclusive: currentYear - spanYears + 1,
  yearEndExclusive: currentYear + 1,
});

const boundsForSingleYear = (
  year: number,
): CollectionCommandPromptYearBounds => ({
  yearStartInclusive: year,
  yearEndExclusive: year + 1,
});

export const extractYearBoundsFromCollectionCommandPrompt = (
  prompt: string,
  referenceDate: Date,
): CollectionCommandPromptYearBounds | null => {
  const normalized = prompt.trim().toLowerCase();
  const currentYear = referenceDate.getFullYear();

  if (/\bthis year\b/.test(normalized)) {
    return boundsForSingleYear(currentYear);
  }

  if (/\blast year\b/.test(normalized)) {
    return boundsForSingleYear(currentYear - 1);
  }

  const spanMatch = normalized.match(
    /\b(?:in |from )?(?:the )?(?:last|past) (\d+|one|two|three|four|five|six|seven|eight|nine|ten) years?\b/,
  );
  if (spanMatch) {
    const spanYears = parseCountToken(spanMatch[1] ?? "");
    if (spanYears !== null) {
      return boundsForSpanEndingCurrentYear(currentYear, spanYears);
    }
  }

  return null;
};

export const applyPromptYearBoundsToIntent = (
  intent: CollectionCommandIntent,
  prompt: string,
  referenceDate: Date,
): CollectionCommandIntent => {
  const bounds = extractYearBoundsFromCollectionCommandPrompt(
    prompt,
    referenceDate,
  );
  if (!bounds) {
    return intent;
  }

  return {
    ...intent,
    selectedYears: [],
    yearStartInclusive: bounds.yearStartInclusive,
    yearEndExclusive: bounds.yearEndExclusive,
    yearOperator: "OR",
  };
};
