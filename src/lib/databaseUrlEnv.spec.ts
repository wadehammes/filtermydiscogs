import { afterEach, describe, expect, it } from "@jest/globals";
import {
  isPrismaPostgresPooledConnectionString,
  MIGRATE_DATABASE_URL_ENV_KEYS,
  readMainDatabaseUrlFromEnv,
  readRuntimeDatabaseUrlFromEnv,
  rewritePrismaPostgresDirectHostToPooled,
  sanitizePostgresConnectionStringForPg,
} from "src/lib/databaseUrlEnv";

const RUNTIME_ENV_KEYS = [
  ...MIGRATE_DATABASE_URL_ENV_KEYS,
  "DATABASE_URL_POOLED",
  "NEXT_PHASE",
] as const;

const DIRECT_PRISMA_URL =
  "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require";
const POOLED_PRISMA_URL =
  "postgres://user:pass@pooled.db.prisma.io:5432/postgres?sslmode=require";

describe("databaseUrlEnv", () => {
  afterEach(() => {
    for (const key of RUNTIME_ENV_KEYS) {
      delete process.env[key];
    }
  });

  it("when DIRECT_URL is set, readMainDatabaseUrlFromEnv returns DIRECT_URL", () => {
    process.env.DIRECT_URL = "postgres://direct";
    process.env.POSTGRES_URL = "postgres://postgres";
    process.env.DATABASE_URL = "postgres://database";

    expect(readMainDatabaseUrlFromEnv()).toBe("postgres://direct");
  });

  it("when only POSTGRES_URL is set, readMainDatabaseUrlFromEnv returns POSTGRES_URL", () => {
    process.env.POSTGRES_URL = "postgres://postgres";
    process.env.DATABASE_URL = "postgres://database";

    expect(readMainDatabaseUrlFromEnv()).toBe("postgres://postgres");
  });

  it("when only DATABASE_URL is set, readMainDatabaseUrlFromEnv returns DATABASE_URL", () => {
    process.env.DATABASE_URL = "postgres://database";

    expect(readMainDatabaseUrlFromEnv()).toBe("postgres://database");
  });

  it("when host is db.prisma.io, rewritePrismaPostgresDirectHostToPooled rewrites to pooled.db.prisma.io", () => {
    expect(rewritePrismaPostgresDirectHostToPooled(DIRECT_PRISMA_URL)).toBe(
      POOLED_PRISMA_URL,
    );
  });

  it("when host is already pooled, rewritePrismaPostgresDirectHostToPooled leaves the string unchanged", () => {
    expect(rewritePrismaPostgresDirectHostToPooled(POOLED_PRISMA_URL)).toBe(
      POOLED_PRISMA_URL,
    );
  });

  it("when host is pooled.db.prisma.io, isPrismaPostgresPooledConnectionString is true", () => {
    expect(isPrismaPostgresPooledConnectionString(POOLED_PRISMA_URL)).toBe(
      true,
    );
  });

  it("when host is db.prisma.io, isPrismaPostgresPooledConnectionString is false", () => {
    expect(isPrismaPostgresPooledConnectionString(DIRECT_PRISMA_URL)).toBe(
      false,
    );
  });

  it("during production build, prefers migrate direct URL over DATABASE_URL_POOLED", () => {
    process.env.NEXT_PHASE = "phase-production-build";
    process.env.POSTGRES_URL =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require";
    process.env.DATABASE_URL_POOLED =
      "postgres://user:pass@pooled.db.prisma.io:5432/postgres?sslmode=require";

    expect(readRuntimeDatabaseUrlFromEnv()).toBe(process.env.POSTGRES_URL);
  });

  it("when DATABASE_URL_POOLED is set, readRuntimeDatabaseUrlFromEnv returns DATABASE_URL_POOLED", () => {
    process.env.DATABASE_URL_POOLED =
      "postgres://user:pass@pooled.db.prisma.io:5432/postgres";
    process.env.DATABASE_URL =
      "postgres://user:pass@db.prisma.io:5432/postgres";

    expect(readRuntimeDatabaseUrlFromEnv()).toBe(
      process.env.DATABASE_URL_POOLED,
    );
  });

  it("when only direct Prisma Postgres DATABASE_URL is set, readRuntimeDatabaseUrlFromEnv returns pooled host", () => {
    process.env.DATABASE_URL =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require";

    expect(readRuntimeDatabaseUrlFromEnv()).toBe(
      "postgres://user:pass@pooled.db.prisma.io:5432/postgres?sslmode=require",
    );
  });

  it("when DATABASE_URL_POOLED is a vercel pull placeholder, readRuntimeDatabaseUrlFromEnv falls back to DATABASE_URL", () => {
    process.env.DATABASE_URL_POOLED = "[SENSITIVE]";
    process.env.DATABASE_URL =
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require";

    expect(readRuntimeDatabaseUrlFromEnv()).toBe(
      "postgres://user:pass@pooled.db.prisma.io:5432/postgres?sslmode=require",
    );
  });

  it("when host is pooled.db.prisma.io, sanitizePostgresConnectionStringForPg omits statement_timeout from the URL", () => {
    const sanitized = sanitizePostgresConnectionStringForPg(
      "postgres://user:pass@pooled.db.prisma.io:5432/postgres?sslmode=require",
      { isProduction: false },
    );

    expect(sanitized).not.toContain("statement_timeout");
    expect(sanitized).toContain("connect_timeout=10");
  });

  it("when host is db.prisma.io, sanitizePostgresConnectionStringForPg keeps statement_timeout on the URL", () => {
    const sanitized = sanitizePostgresConnectionStringForPg(
      "postgres://user:pass@db.prisma.io:5432/postgres?sslmode=require",
      { isProduction: false },
    );

    expect(sanitized).toContain("statement_timeout=30000");
  });
});
