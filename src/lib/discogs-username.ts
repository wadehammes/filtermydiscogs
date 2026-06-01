/** Discogs usernames: letters, numbers, underscore, hyphen, period (max 50 chars). */
const DISCOGS_USERNAME_PATTERN = /^[a-zA-Z0-9._-]+$/;
const DISCOGS_USERNAME_MAX_LENGTH = 50;

export const isValidDiscogsUsername = (username: string): boolean =>
  DISCOGS_USERNAME_PATTERN.test(username) &&
  username.length <= DISCOGS_USERNAME_MAX_LENGTH;
