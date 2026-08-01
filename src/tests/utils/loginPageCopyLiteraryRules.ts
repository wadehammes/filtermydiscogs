import type { LoginPageCopyEntry } from "src/constants/loginPageCopy.registry";

export type LoginPageCopyRule = "em-dash" | "banned-phrase" | "embellishment";

export type LoginPageCopyViolation = {
  entryId: string;
  rule: LoginPageCopyRule;
  message: string;
};

export const LOGIN_PAGE_COPY_BANNED_PHRASES = [
  "notes visible on public",
  "with your notes visible",
  "on public crate pages when",
  "shown on public crate pages",
  "public crate pages when shareable",
  "notes appear on public",
  "your notes visible on the page",
] as const;

export const LOGIN_PAGE_COPY_EMBELLISHMENT_TERMS = [
  "celebrate",
  "beautifully",
  "beautiful visualizations",
  "passion project",
  "game-changer",
  "game changer",
  "unlock",
  "effortlessly",
  "seamlessly",
  "stunning",
  "gorgeous",
  "transformative",
  "revolutionary",
] as const;

const emDashPattern = /\u2014/;

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const containsEmbellishmentTerm = (text: string, term: string): boolean => {
  const pattern = new RegExp(`\\b${escapeRegExp(term)}\\b`, "i");
  return pattern.test(text);
};

export const findEmDashViolation = (
  text: string,
): LoginPageCopyViolation | null => {
  if (!emDashPattern.test(text)) {
    return null;
  }

  return {
    entryId: "",
    rule: "em-dash",
    message: "Em dashes are not allowed in login page copy.",
  };
};

export const findBannedPhraseViolations = (
  text: string,
): LoginPageCopyViolation[] => {
  const normalized = text.toLowerCase();

  return LOGIN_PAGE_COPY_BANNED_PHRASES.flatMap((phrase) => {
    if (!normalized.includes(phrase)) {
      return [];
    }

    return [
      {
        entryId: "",
        rule: "banned-phrase",
        message: `Banned inaccurate phrase: "${phrase}".`,
      },
    ];
  });
};

export const findEmbellishmentViolations = (
  text: string,
): LoginPageCopyViolation[] => {
  return LOGIN_PAGE_COPY_EMBELLISHMENT_TERMS.flatMap((term) => {
    if (!containsEmbellishmentTerm(text, term)) {
      return [];
    }

    return [
      {
        entryId: "",
        rule: "embellishment",
        message: `Embellishment term is not allowed: "${term}".`,
      },
    ];
  });
};

export const validateLoginPageCopyText = (
  text: string,
): LoginPageCopyViolation[] => {
  const violations: LoginPageCopyViolation[] = [];
  const emDashViolation = findEmDashViolation(text);

  if (emDashViolation) {
    violations.push(emDashViolation);
  }

  violations.push(
    ...findBannedPhraseViolations(text),
    ...findEmbellishmentViolations(text),
  );

  return violations;
};

export const validateLoginPageCopyEntries = (
  entries: LoginPageCopyEntry[],
): LoginPageCopyViolation[] => {
  return entries.flatMap((entry) =>
    validateLoginPageCopyText(entry.text).map((violation) => ({
      ...violation,
      entryId: entry.id,
      message: `${entry.id}: ${violation.message}`,
    })),
  );
};

export const formatLoginPageCopyViolations = (
  violations: LoginPageCopyViolation[],
): string =>
  violations
    .map((violation) => `- [${violation.rule}] ${violation.message}`)
    .join("\n");
