import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

export const parseDryRunInstallDirs = (output) => {
  const entries = [];
  let label = "";

  for (const line of output.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("Install location:")) {
      const nameMatch = trimmed.match(/^(.+?)\s+\(/);
      if (nameMatch) {
        label = nameMatch[1] ?? trimmed;
      }
    }

    const locationMatch = line.match(/Install location:\s+(\S+)/);
    if (locationMatch && label) {
      entries.push({ label, dir: locationMatch[1] });
      label = "";
    }
  }

  return entries;
};

export const isPlaywrightBrowserInstallDirReady = (dir, label) => {
  if (!fs.existsSync(dir)) {
    return false;
  }

  const isHeadlessShell =
    label.includes("Headless Shell") || dir.includes("headless_shell");

  if (isHeadlessShell) {
    const shellDir = fs
      .readdirSync(dir)
      .find((name) => name.startsWith("chrome-headless-shell"));

    if (!shellDir) {
      return false;
    }

    const shellBinary =
      process.platform === "win32"
        ? "chrome-headless-shell.exe"
        : "chrome-headless-shell";

    return fs.existsSync(path.join(dir, shellDir, shellBinary));
  }

  if (label.includes("Chrome for Testing") || dir.includes("/chromium-")) {
    if (process.platform === "darwin") {
      return fs.existsSync(
        path.join(dir, "chrome-mac-arm64", "Google Chrome for Testing.app"),
      );
    }

    if (process.platform === "linux") {
      return fs.existsSync(path.join(dir, "chrome-linux", "chrome"));
    }

    if (process.platform === "win32") {
      return fs.existsSync(path.join(dir, "chrome-win", "chrome.exe"));
    }
  }

  return fs.readdirSync(dir).length > 0;
};

export const playwrightChromiumInstallMissing = () => {
  let dryRunOutput = "";

  try {
    dryRunOutput = execFileSync(
      "pnpm",
      ["exec", "playwright", "install", "chromium", "--dry-run"],
      { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } catch (error) {
    const err = error;
    dryRunOutput = `${err.stdout ?? ""}${err.stderr ?? ""}`;

    if (!dryRunOutput.trim()) {
      throw error;
    }
  }

  const installDirs = parseDryRunInstallDirs(dryRunOutput);

  return installDirs.filter(
    ({ dir, label }) => !isPlaywrightBrowserInstallDirReady(dir, label),
  );
};

const mode = process.argv[2];

if (mode === "check") {
  const missing = playwrightChromiumInstallMissing();
  process.exit(missing.length === 0 ? 0 : 1);
}

if (mode !== undefined) {
  console.error(`Unknown mode: ${mode}`);
  process.exit(2);
}
