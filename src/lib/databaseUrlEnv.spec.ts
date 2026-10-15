import { afterEach, describe, expect, it } from "@jest/globals";
import {
  MIGRATE_DATABASE_URL_ENV_KEYS,
  readMainDatabaseUrlFromEnv,
} from "src/lib/databaseUrlEnv";

describe("databaseUrlEnv", () => {
  const envKeys = [...MIGRATE_DATABASE_URL_ENV_KEYS] as const;

  afterEach(() => {
    for (const key of envKeys) {
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
});
