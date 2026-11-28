import type { CollectionCommandIntent } from "src/lib/validation/collectionCommand.schemas";
import { applyPromptYearBoundsToIntent } from "src/utils/collectionCommandPromptYears";

const RELATIVE_YEAR_PHRASE =
  /\b(?:last|past)\s+(?:\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+years?\b/i;

const FOUR_DIGIT_YEAR = "(19\\d{2}|20\\d{2})";

const normalizeStyleLabel = (label: string): string =>
  label
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,.]+$/, "");

const splitStyleList = (value: string): string[] =>
  value
    .split(/\s+(?:and|&)\s+/i)
    .map(normalizeStyleLabel)
    .filter(Boolean);

export const extractExplicitYearsFromPrompt = (prompt: string): number[] => {
  if (RELATIVE_YEAR_PHRASE.test(prompt)) {
    return [];
  }

  const betweenMatch = prompt.match(
    new RegExp(
      `\\bbetween\\s+${FOUR_DIGIT_YEAR}\\s+and\\s+${FOUR_DIGIT_YEAR}\\b`,
      "i",
    ),
  );
  if (betweenMatch) {
    const start = Number.parseInt(betweenMatch[1] ?? "", 10);
    const end = Number.parseInt(betweenMatch[2] ?? "", 10);
    if (start <= end) {
      const years: number[] = [];
      for (let year = start; year <= end; year += 1) {
        years.push(year);
      }
      return years;
    }
  }

  const years = new Set<number>();
  const patterns = [
    new RegExp(`\\bfrom\\s+${FOUR_DIGIT_YEAR}\\b`, "gi"),
    new RegExp(`\\bin\\s+${FOUR_DIGIT_YEAR}\\b`, "gi"),
    new RegExp(`\\breleased\\s+(?:in\\s+)?${FOUR_DIGIT_YEAR}\\b`, "gi"),
    new RegExp(`\\b${FOUR_DIGIT_YEAR}\\s+releases?\\b`, "gi"),
  ];

  for (const pattern of patterns) {
    for (const match of prompt.matchAll(pattern)) {
      const yearToken = match[1];
      if (yearToken) {
        years.add(Number.parseInt(yearToken, 10));
      }
    }
  }

  if (/\bin\s+(?:19|20)\d{2}/i.test(prompt)) {
    for (const match of prompt.matchAll(/\b(19\d{2}|20\d{2})\b/g)) {
      const yearToken = match[1];
      if (yearToken) {
        years.add(Number.parseInt(yearToken, 10));
      }
    }
  }

  return [...years].sort((first, second) => first - second);
};

export const extractExcludedStyleLabelsFromPrompt = (
  prompt: string,
): string[] => {
  const labels: string[] = [];

  const tailNegation = prompt.match(
    /\bthat\s+(?:aren't|arent|are not|don't|do not|isn't|is not)\s+(.+?)\s*$/i,
  );
  if (tailNegation?.[1]) {
    const negated = tailNegation[1]
      .replace(/^have\s+/i, "")
      .replace(/^tagged\s+(?:as\s+)?/i, "");
    labels.push(...splitStyleList(negated));
  }

  const excludingMatch = prompt.match(
    /\b(?:excluding|without|except)\s+(.+?)(?:\s*\.?\s*$|[,;])/i,
  );
  if (excludingMatch?.[1]) {
    labels.push(...splitStyleList(excludingMatch[1]));
  }

  const unique = new Map<string, string>();
  for (const label of labels) {
    const key = label.toLowerCase();
    if (!unique.has(key)) {
      unique.set(key, label);
    }
  }

  return [...unique.values()];
};

export const stripExcludePhrasesFromPrompt = (prompt: string): string => {
  return prompt
    .replace(
      /\bthat\s+(?:aren't|arent|are not|don't|do not|isn't|is not)\s+.+?\s*$/i,
      "",
    )
    .replace(/\b(?:excluding|without|except)\s+.+?(?:\s*\.?\s*$|[,;])/i, "")
    .trim();
};

export const extractIncludeStyleLabelsFromPrompt = (
  prompt: string,
): string[] => {
  const normalized = prompt.trim();

  const andMatch = normalized.match(/\b(.+?)\s+and\s+(.+?)\s+releases?\b/i);
  if (andMatch?.[1] && andMatch[2]) {
    const first = normalizeStyleLabel(
      andMatch[1].replace(/^(?:show\s+me\s+|all\s+)/i, ""),
    );
    const second = normalizeStyleLabel(andMatch[2]);
    if (first && second) {
      return [first, second];
    }
  }

  const singleMatch = normalized.match(
    /(?:^|\b)(?:show\s+me\s+|find\s+|filter\s+to\s+|filter\s+)?(?:all\s+)?(.+?)\s+releases?\b/i,
  );
  if (singleMatch?.[1]) {
    const label = normalizeStyleLabel(
      singleMatch[1].replace(/\bfrom\s+(19\d{2}|20\d{2})\b.*$/i, "").trim(),
    );

    if (label) {
      return [label];
    }
  }

  const fromYearMatch = normalized.match(
    /\b(?:show\s+me\s+|find\s+|filter\s+)?(?:all\s+)?(.+?)\s+from\s+(19\d{2}|20\d{2})\b/i,
  );
  if (fromYearMatch?.[1]) {
    const styleFragment = fromYearMatch[1].replace(
      /^(?:show\s+me\s+|all\s+)/i,
      "",
    );
    const afterLeadClause = styleFragment.includes(":")
      ? (styleFragment.split(":").pop() ?? styleFragment)
      : styleFragment;
    const styleLabel = normalizeStyleLabel(afterLeadClause);
    if (styleLabel && !/^vinyl\b/i.test(styleLabel)) {
      return [styleLabel];
    }
  }

  return [];
};

const labelsEqual = (left: string, right: string): boolean =>
  left.trim().toLowerCase() === right.trim().toLowerCase();

const removeExcludedFromSelected = (
  selected: string[],
  excluded: string[],
): string[] =>
  selected.filter((style) => !excluded.some((tag) => labelsEqual(style, tag)));

export const applyCollectionCommandPromptRules = (
  intent: CollectionCommandIntent,
  prompt: string,
  referenceDate: Date,
): CollectionCommandIntent => {
  let next = applyPromptYearBoundsToIntent(intent, prompt, referenceDate);

  const excludedFromPrompt = extractExcludedStyleLabelsFromPrompt(prompt);
  const promptForInclude = stripExcludePhrasesFromPrompt(prompt);
  const includeFromPrompt =
    extractIncludeStyleLabelsFromPrompt(promptForInclude);
  const explicitYears = extractExplicitYearsFromPrompt(prompt);

  if (explicitYears.length > 0) {
    next = {
      ...next,
      selectedYears: explicitYears,
      yearStartInclusive: 0,
      yearEndExclusive: 0,
      yearOperator: "OR",
    };
  }

  const excludedStyles = [
    ...new Set([...(next.excludedStyles ?? []), ...excludedFromPrompt]),
  ];

  let selectedStyles = removeExcludedFromSelected(
    next.selectedStyles ?? [],
    excludedStyles,
  );

  if (
    excludedStyles.length > 0 &&
    includeFromPrompt.length > 0 &&
    (next.styleOperator === "NONE" || selectedStyles.length === 0)
  ) {
    selectedStyles = includeFromPrompt;
    next = { ...next, styleOperator: "OR" };
  } else if (selectedStyles.length === 0 && includeFromPrompt.length > 0) {
    selectedStyles = includeFromPrompt;
    if (next.styleOperator === "NONE") {
      next = { ...next, styleOperator: "OR" };
    }
  }

  return {
    ...next,
    selectedStyles,
    excludedStyles,
  };
};
