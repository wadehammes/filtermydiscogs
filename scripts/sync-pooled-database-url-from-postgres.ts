import fs from "node:fs";
import { rewritePrismaPostgresDirectHostToPooled } from "../src/lib/databaseUrlEnv.ts";

const envPath = process.argv[2] ?? ".env.local";

if (!fs.existsSync(envPath)) {
  console.error(`Missing ${envPath}`);
  process.exit(1);
}

const readEnv = (text: string, key: string): string | undefined => {
  const match = text.match(new RegExp(`^${key}=(.+)$`, "m"));
  if (!match) {
    return undefined;
  }
  return match[1].replace(/^["']|["']$/g, "");
};

const writeEnv = (text: string, key: string, value: string): string => {
  const line = `${key}=${value}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");
  if (pattern.test(text)) {
    return text.replace(pattern, line);
  }
  const trimmed = text.endsWith("\n") ? text : `${text}\n`;
  return `${trimmed}${line}\n`;
};

let text = fs.readFileSync(envPath, "utf8");
const postgresUrl = readEnv(text, "POSTGRES_URL");

if (!postgresUrl) {
  console.error("POSTGRES_URL is not set; nothing to sync.");
  process.exit(1);
}

try {
  new URL(postgresUrl);
} catch {
  console.error("POSTGRES_URL is not a valid URL.");
  process.exit(1);
}

const pooledString = rewritePrismaPostgresDirectHostToPooled(postgresUrl);

text = writeEnv(text, "DATABASE_URL", postgresUrl);
text = writeEnv(text, "DATABASE_URL_POOLED", pooledString);

fs.writeFileSync(envPath, text);

console.log(
  `Synced DATABASE_URL (direct) and DATABASE_URL_POOLED from POSTGRES_URL in ${envPath}.`,
);
