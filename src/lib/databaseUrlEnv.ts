export const MIGRATE_DATABASE_URL_ENV_KEYS = [
  "DIRECT_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
] as const;

export const readMainDatabaseUrlFromEnv = (): string | undefined =>
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;
