import { readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = process.cwd();

const NEXT_APP_FILE =
  /\/(page|layout|loading|error|not-found|template|default)\.tsx$/;
const NEXT_ROUTE_FILE = /\/route\.tsx?$/;

const allowsFunctionDeclaration = (relativePath) =>
  NEXT_ROUTE_FILE.test(relativePath) ||
  NEXT_APP_FILE.test(relativePath) ||
  relativePath === "src/middleware.ts" ||
  relativePath === "src/instrumentation.ts";

const skipCharInString = (source, index, quote) => {
  let pos = index + 1;
  while (pos < source.length) {
    if (source[pos] === "\\") {
      pos += 2;
      continue;
    }
    if (source[pos] === quote) {
      return pos + 1;
    }
    pos += 1;
  }
  return source.length;
};

const scanBalanced = (source, start, open, close) => {
  let depth = 0;
  let pos = start;

  while (pos < source.length) {
    const char = source[pos];

    if (char === '"' || char === "'" || char === "`") {
      pos = skipCharInString(source, pos, char);
      continue;
    }

    if (char === open) {
      depth += 1;
    } else if (char === close) {
      depth -= 1;
      if (depth === 0) {
        return pos + 1;
      }
    }

    pos += 1;
  }

  return start;
};

const convertExportFunctions = (source) => {
  const pattern = /export (async )?function ([A-Za-z_$][\w$]*)\s*\(/g;
  const replacements = [];

  for (const match of source.matchAll(pattern)) {
    const asyncKeyword = match[1] ?? "";
    const name = match[2];
    const paramsStart = match.index + match[0].length - 1;
    const paramsEnd = scanBalanced(source, paramsStart, "(", ")");
    let cursor = paramsEnd;

    while (cursor < source.length && /\s/.test(source[cursor])) {
      cursor += 1;
    }

    let returnType = "";

    if (source[cursor] === ":") {
      const returnStart = cursor;
      cursor += 1;

      while (cursor < source.length && /\s/.test(source[cursor])) {
        cursor += 1;
      }

      if (source[cursor] === "{") {
        const typeEnd = scanBalanced(source, cursor, "{", "}");
        cursor = typeEnd;
      } else {
        while (cursor < source.length) {
          const char = source[cursor];
          if (char === '"' || char === "'" || char === "`") {
            cursor = skipCharInString(source, cursor, char);
            continue;
          }
          if (char === "<") {
            cursor = scanBalanced(source, cursor, "<", ">");
            continue;
          }
          if (char === "(") {
            cursor = scanBalanced(source, cursor, "(", ")");
            continue;
          }
          if (char === "{") {
            break;
          }
          cursor += 1;
        }
      }

      returnType = source.slice(returnStart, cursor);
    }

    while (cursor < source.length && /\s/.test(source[cursor])) {
      cursor += 1;
    }

    if (source[cursor] !== "{") {
      continue;
    }

    const asyncPart = asyncKeyword ? "async " : "";
    const params = source.slice(paramsStart, paramsEnd);
    const replacement = `export const ${name} = ${asyncPart}${params}${returnType} => ${source[cursor]}`;

    replacements.push({
      start: match.index,
      end: cursor + 1,
      text: replacement,
    });
  }

  if (replacements.length === 0) {
    return null;
  }

  let next = source;
  for (const { start, end, text } of replacements.toReversed()) {
    next = `${next.slice(0, start)}${text}${next.slice(end)}`;
  }

  return next === source ? null : next;
};

const listTargets = (argv) => {
  if (argv.length > 0) {
    return argv.map((file) => file.replace(/\\/g, "/"));
  }

  const files = [];

  const walk = (directory) => {
    for (const entry of readdirSync(directory)) {
      const absolutePath = join(directory, entry);
      const stats = statSync(absolutePath);

      if (stats.isDirectory()) {
        walk(absolutePath);
        continue;
      }

      const relativePath = relative(ROOT, absolutePath).replace(/\\/g, "/");

      if (
        relativePath.startsWith("src/utils/") &&
        relativePath.endsWith(".ts") &&
        !relativePath.includes(".spec.")
      ) {
        files.push(relativePath);
      }
    }
  };

  walk(join(ROOT, "src/utils"));
  return files.sort();
};

const main = () => {
  const argv = process.argv.slice(2);
  const updated = [];

  for (const filePath of listTargets(argv)) {
    if (allowsFunctionDeclaration(filePath)) {
      continue;
    }

    const absolutePath = join(ROOT, filePath);
    const before = readFileSync(absolutePath, "utf8");
    const after = convertExportFunctions(before);

    if (after && after !== before) {
      writeFileSync(absolutePath, after, "utf8");
      updated.push(filePath);
    }
  }

  console.log(
    updated.length
      ? `Converted:\n${updated.join("\n")}`
      : "No export function declarations to convert.",
  );
};

main();
