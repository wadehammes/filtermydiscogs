export const MIGRATE_DATABASE_URL_ENV_KEYS = [
  "DIRECT_URL",
  "POSTGRES_URL",
  "DATABASE_URL",
] as const;

export const readMainDatabaseUrlFromEnv = (): string | undefined =>
  process.env.DIRECT_URL ??
  process.env.POSTGRES_URL ??
  process.env.DATABASE_URL;

const PRISMA_POSTGRES_DIRECT_HOST = "db.prisma.io";
const PRISMA_POSTGRES_POOLED_HOST = "pooled.db.prisma.io";

export const isPrismaPostgresPooledConnectionString = (
  connectionString: string,
): boolean => {
  try {
    return new URL(connectionString).hostname === PRISMA_POSTGRES_POOLED_HOST;
  } catch {
    return false;
  }
};

export const sanitizePostgresConnectionStringForPg = (
  connectionString: string,
  options?: { isProduction?: boolean },
): string => {
  const url = new URL(connectionString);
  const isProduction =
    options?.isProduction ?? process.env.NODE_ENV === "production";
  const isPooled = isPrismaPostgresPooledConnectionString(connectionString);

  const sslMode = url.searchParams.get("sslmode");
  if (
    sslMode === "prefer" ||
    sslMode === "require" ||
    sslMode === "verify-ca"
  ) {
    url.searchParams.set("sslmode", "verify-full");
  } else if (isProduction && !sslMode) {
    url.searchParams.set("sslmode", "verify-full");
  }

  if (!isPooled) {
    url.searchParams.set("statement_timeout", "30000");
  }

  url.searchParams.set("connect_timeout", "10");
  url.searchParams.set("pool_timeout", "10");

  return url.toString();
};

const POSTGRES_URL_PROTOCOLS = new Set(["postgres:", "postgresql:"]);

const isUsablePostgresConnectionString = (
  value: string | undefined,
): value is string => {
  const trimmed = value?.trim();
  if (!trimmed || trimmed.startsWith("[") || trimmed.includes("[SENSITIVE]")) {
    return false;
  }

  try {
    const url = new URL(trimmed);
    return POSTGRES_URL_PROTOCOLS.has(url.protocol) && url.hostname.length > 0;
  } catch {
    return false;
  }
};

export const rewritePrismaPostgresDirectHostToPooled = (
  connectionString: string,
): string => {
  try {
    const url = new URL(connectionString);
    if (url.hostname !== PRISMA_POSTGRES_DIRECT_HOST) {
      return connectionString;
    }

    url.hostname = PRISMA_POSTGRES_POOLED_HOST;
    return url.toString();
  } catch {
    return connectionString;
  }
};

export const readRuntimeDatabaseUrlFromEnv = (): string | undefined => {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    const migrateUrl = readMainDatabaseUrlFromEnv();
    if (isUsablePostgresConnectionString(migrateUrl)) {
      return migrateUrl.trim();
    }
  }

  const pooled = process.env.DATABASE_URL_POOLED;
  if (isUsablePostgresConnectionString(pooled)) {
    return pooled.trim();
  }

  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!isUsablePostgresConnectionString(databaseUrl)) {
    return undefined;
  }

  return rewritePrismaPostgresDirectHostToPooled(databaseUrl);
};
