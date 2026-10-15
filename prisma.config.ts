import { defineConfig } from "prisma/config";

const appendConnectTimeout = (url: string): string => {
  try {
    const parsed = new URL(url);
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "30");
    }
    return parsed.toString();
  } catch {
    return url;
  }
};

const resolveMigrateDatabaseUrl = (): string => {
  const url =
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;
  if (!url) {
    return "";
  }

  return appendConnectTimeout(url);
};

const resolveShadowDatabaseUrl = (): string | undefined => {
  const explicit = process.env.SHADOW_DATABASE_URL?.trim();
  if (explicit) {
    return appendConnectTimeout(explicit);
  }

  const main =
    process.env.DIRECT_URL ??
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL;
  if (!main) {
    return undefined;
  }

  try {
    const parsed = new URL(main);
    const host = parsed.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return undefined;
    }

    const dbName = parsed.pathname.replace(/^\//, "").replace(/\/$/, "");
    if (!dbName || dbName.endsWith("_shadow")) {
      return undefined;
    }

    parsed.pathname = `/${dbName}_shadow`;
    return appendConnectTimeout(parsed.toString());
  } catch {
    return undefined;
  }
};

const shadowDatabaseUrl = resolveShadowDatabaseUrl();

export default defineConfig({
  schema: "./prisma/schema.prisma",
  datasource: {
    url: resolveMigrateDatabaseUrl(),
    ...(shadowDatabaseUrl ? { shadowDatabaseUrl } : {}),
  },
});
