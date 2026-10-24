import { readMainDatabaseUrlFromEnv } from "../src/lib/databaseUrlEnv.ts";

const migrateUrl = readMainDatabaseUrlFromEnv()?.trim();

if (!migrateUrl) {
  process.exit(2);
}

process.stdout.write(migrateUrl);
