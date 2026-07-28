import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from "@jest/globals";
import { copyToClipboard } from "src/utils/copyToClipboard";

describe("copyToClipboard", () => {
  const originalClipboard = navigator.clipboard;
  const originalIsSecureContext = window.isSecureContext;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      configurable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: originalIsSecureContext,
      configurable: true,
    });
  });

  it("uses the Clipboard API in a secure context", async () => {
    const writeText = jest
      .fn<(text: string) => Promise<void>>()
      .mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });

    await expect(copyToClipboard("crate link")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("crate link");
  });

  it("falls back to execCommand when the Clipboard API is unavailable", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });

    const execCommand = jest.fn().mockReturnValue(true);
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
    });

    await expect(copyToClipboard("fallback text")).resolves.toBe(true);
    expect(execCommand).toHaveBeenCalledWith("copy");
    expect(document.body.querySelector("textarea")).toBeNull();
  });

  it("returns false when execCommand fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: undefined,
      configurable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: false,
      configurable: true,
    });

    const execCommand = jest.fn().mockImplementation(() => {
      throw new Error("copy blocked");
    });
    Object.defineProperty(document, "execCommand", {
      value: execCommand,
      configurable: true,
    });

    await expect(copyToClipboard("blocked text")).resolves.toBe(false);
  });

  it("returns false when the Clipboard API throws", async () => {
    const writeText = jest
      .fn<(text: string) => Promise<void>>()
      .mockRejectedValue(new Error("permission denied"));
    const consoleError = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    Object.defineProperty(navigator, "clipboard", {
      value: { writeText },
      configurable: true,
    });
    Object.defineProperty(window, "isSecureContext", {
      value: true,
      configurable: true,
    });

    await expect(copyToClipboard("denied text")).resolves.toBe(false);
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });
});
