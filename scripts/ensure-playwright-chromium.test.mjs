import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, it } from "node:test";
import {
  isPlaywrightBrowserInstallDirReady,
  parseDryRunInstallDirs,
} from "./ensure-playwright-chromium.mjs";

describe("parseDryRunInstallDirs", () => {
  it("when dry-run lists headless shell, parses install location", () => {
    const sample = `Chrome Headless Shell 156.0.8078.4 (playwright chromium-headless-shell v1248)
  Install location:    /tmp/chromium_headless_shell-1248
`;

    assert.deepEqual(parseDryRunInstallDirs(sample), [
      {
        label: "Chrome Headless Shell 156.0.8078.4",
        dir: "/tmp/chromium_headless_shell-1248",
      },
    ]);
  });
});

describe("isPlaywrightBrowserInstallDirReady", () => {
  it("when the install directory is missing, returns false", () => {
    assert.equal(
      isPlaywrightBrowserInstallDirReady(
        path.join(os.tmpdir(), "playwright-missing-dir"),
        "Chrome Headless Shell 156.0.8078.4",
      ),
      false,
    );
  });

  it("when headless shell binary is present, returns true", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pw-shell-"));
    const shellRoot = path.join(root, "chrome-headless-shell-linux64");
    fs.mkdirSync(shellRoot, { recursive: true });
    fs.writeFileSync(path.join(shellRoot, "chrome-headless-shell"), "");

    assert.equal(
      isPlaywrightBrowserInstallDirReady(
        root,
        "Chrome Headless Shell 156.0.8078.4",
      ),
      true,
    );
  });

  it("when Chromium for Testing layout matches the platform, returns true", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pw-chromium-"));

    if (process.platform === "darwin") {
      fs.mkdirSync(
        path.join(root, "chrome-mac-arm64", "Google Chrome for Testing.app"),
        { recursive: true },
      );
    } else if (process.platform === "linux") {
      fs.mkdirSync(path.join(root, "chrome-linux"), { recursive: true });
      fs.writeFileSync(path.join(root, "chrome-linux", "chrome"), "");
    } else if (process.platform === "win32") {
      fs.mkdirSync(path.join(root, "chrome-win"), { recursive: true });
      fs.writeFileSync(path.join(root, "chrome-win", "chrome.exe"), "");
    }

    assert.equal(
      isPlaywrightBrowserInstallDirReady(
        root,
        "Chrome for Testing 156.0.8078.4",
      ),
      true,
    );
  });

  it("when FFmpeg install dir is non-empty, returns true", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "pw-ffmpeg-"));
    fs.writeFileSync(path.join(root, "ffmpeg"), "");

    assert.equal(
      isPlaywrightBrowserInstallDirReady(
        root,
        "FFmpeg (playwright ffmpeg v1013)",
      ),
      true,
    );
  });
});
