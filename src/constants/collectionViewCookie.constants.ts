export const VIEW_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

export const collectionViewCookieAttributeSuffix = `; path=/; max-age=${VIEW_COOKIE_MAX_AGE_SECONDS}; SameSite=Lax`;
