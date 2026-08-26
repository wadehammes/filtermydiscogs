import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { THEME_STORAGE_KEY } from "src/constants/storageKeys";
import { setDocumentCookieForTests } from "src/tests/utils/documentCookie";
import { applyThemeFromStorage } from "src/utils/applyThemeFromStorage";

describe("applyThemeFromStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    setDocumentCookieForTests("");
  });

  afterEach(() => {
    setDocumentCookieForTests("");
  });

  it("uses OS preference when logged out", () => {
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");

    applyThemeFromStorage();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("uses stored palette theme when logged in", () => {
    setDocumentCookieForTests("discogs_session=1");
    localStorage.setItem(THEME_STORAGE_KEY, "sepia");

    applyThemeFromStorage();

    expect(document.documentElement.getAttribute("data-theme")).toBe("sepia");
  });

  it("resolves system preference when logged in", () => {
    setDocumentCookieForTests("discogs_session=1");
    localStorage.setItem(THEME_STORAGE_KEY, "system");
    window.matchMedia = jest.fn().mockImplementation((query: string) => ({
      matches: query === "(prefers-color-scheme: dark)",
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));

    applyThemeFromStorage();

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });
});
