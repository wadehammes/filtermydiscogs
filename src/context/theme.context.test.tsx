import { act, renderHook } from "@testing-library/react";
import { mocked } from "jest-mock";
import { useMediaQuery } from "usehooks-ts";
import { ThemeProvider, useTheme } from "./theme.context";

const mockUseMediaQuery = mocked(useMediaQuery);

describe("ThemeProvider", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
    document.documentElement.classList.remove("theme-transitioning");
    mockUseMediaQuery.mockReturnValue(false);
  });

  it("provides default theme based on system preference", () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe("light");
    expect(result.current.resolvedTheme).toBe("light");
  });

  it("loads stored theme from localStorage", () => {
    localStorage.setItem("filtermydiscogs_theme", "dark");
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
  });

  it("sets theme and updates localStorage", () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(result.current.theme).toBe("dark");
    expect(result.current.resolvedTheme).toBe("dark");
    expect(localStorage.getItem("filtermydiscogs_theme")).toBe("dark");
  });

  it("applies theme to document element", () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    act(() => {
      result.current.setTheme("dark");
    });

    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("migrates 'system' theme to explicit theme", () => {
    localStorage.setItem("filtermydiscogs_theme", "system");
    mockUseMediaQuery.mockReturnValue(true);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("filtermydiscogs_theme")).toBe("dark");
  });

  it("handles invalid localStorage theme gracefully", () => {
    localStorage.setItem("filtermydiscogs_theme", "invalid");
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
    });

    expect(result.current.theme).toBe("light");
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

  it("adds theme-transitioning class when theme changes", () => {
    mockUseMediaQuery.mockReturnValue(false);

    const { result } = renderHook(() => useTheme(), {
      wrapper: ThemeProvider,
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
});
