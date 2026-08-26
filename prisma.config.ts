import { defineConfig } from "prisma/config";

function resolveMigrateDatabaseUrl(): string {
  const url =
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;
  if (!url) {
    return "";
  }

  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "30");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: resolveMigrateDatabaseUrl(),
  },
});
