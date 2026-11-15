export const E2E_TAG_DESKTOP_ONLY = "@desktop-only";

export const E2E_TAG_MOBILE_ONLY = "@mobile-only";

export const E2E_TAG_FULL_SUITE = "@full-suite";

export const E2E_TAG_DESKTOP_ONLY_GREP = new RegExp(E2E_TAG_DESKTOP_ONLY);

export const E2E_TAG_MOBILE_ONLY_GREP = new RegExp(E2E_TAG_MOBILE_ONLY);

export const E2E_TAG_SMOKE_GREP_INVERT = new RegExp(
  `${E2E_TAG_MOBILE_ONLY}|${E2E_TAG_FULL_SUITE}`,
);
