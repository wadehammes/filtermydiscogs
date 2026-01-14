import { act, renderHook, waitFor } from "@testing-library/react";
import { mocked } from "jest-mock";
import { usePathname } from "next/navigation";
import { useMediaQuery } from "usehooks-ts";
import { ThemeProvider, useTheme } from "./theme.context";

const mockUseMediaQuery = mocked(useMediaQuery);
const mockUsePathname = mocked(usePathname);

jest.mock("next/navigation", () => ({
  usePathname: jest.fn(() => "/"),
}));

describe("ThemeProvider", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("theme-transitioning");
    mockUseMediaQuery.mockReturnValue(false);
    mockUsePathname.mockReturnValue("/");
  });

  it("provides default theme based on system preference", async () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("light");
      expect(result.current.resolvedTheme).toBe("light");
    });
  });

  it("loads stored theme from localStorage", async () => {
    localStorage.setItem("filtermydiscogs_theme", "dark");
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
    });
  });

  it("sets theme and updates localStorage", async () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBeDefined();
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(localStorage.getItem("filtermydiscogs_theme")).toBe("dark");
  });

  it("applies theme to document element", async () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBeDefined();
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("migrates 'system' theme to explicit theme", async () => {
    localStorage.setItem("filtermydiscogs_theme", "system");
    mockUseMediaQuery.mockReturnValue(true);

    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("dark");
      expect(localStorage.getItem("filtermydiscogs_theme")).toBe("dark");
    });
  });

  it("handles invalid localStorage theme gracefully", async () => {
    localStorage.setItem("filtermydiscogs_theme", "invalid");
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("light");
    });
  });

  it("throws error when useTheme is used outside ThemeProvider", () => {
    const consoleSpy = jest
      .spyOn(console, "error")
      .mockImplementation(() => {});

    expect(() => {
      renderHook(() => useTheme());
    }).toThrow("useTheme must be used within a ThemeProvider");

    consoleSpy.mockRestore();
  });

  it("adds theme-transitioning class when theme changes", async () => {
    mockUseMediaQuery.mockReturnValue(false);
    document.documentElement.setAttribute("data-theme", "light");

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBeDefined();
    });

    const rafCallbacks: Array<(time: number) => void> = [];
    const rafSpy = jest.spyOn(window, "requestAnimationFrame");
    rafSpy.mockImplementation((cb) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(
      document.documentElement.classList.contains("theme-transitioning"),
    ).toBe(true);

    rafCallbacks.forEach((cb) => {
      cb(0);
    });

    expect(
      document.documentElement.classList.contains("theme-transitioning"),
    ).toBe(false);

    rafSpy.mockRestore();
  });

  it("reads initial theme from DOM if available", async () => {
    document.documentElement.setAttribute("data-theme", "dark");
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("dark");
    });
  });

  it("prioritizes DOM theme over localStorage", async () => {
    localStorage.setItem("filtermydiscogs_theme", "light");
    document.documentElement.setAttribute("data-theme", "dark");
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBe("dark");
    });
  });

  it("maintains theme when pathname changes", async () => {
    mockUseMediaQuery.mockReturnValue(false);
    mockUsePathname.mockReturnValue("/");

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      expect(result.current.theme).toBeDefined();
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");

    document.documentElement.removeAttribute("data-theme");
    mockUsePathname.mockReturnValue("/dashboard");

    const { result: resultAfterNav } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    await waitFor(() => {
      const themeAttr = document.documentElement.getAttribute("data-theme");
      expect(themeAttr).toBe("dark");
      expect(resultAfterNav.current.theme).toBe("dark");
    });
  });
});
