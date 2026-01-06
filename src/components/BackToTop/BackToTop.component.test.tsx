import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BackToTop } from "./BackToTop.component";

describe("BackToTop", () => {
  beforeEach(() => {
    window.scrollTo = jest.fn();
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });
    Object.defineProperty(document.documentElement, "scrollTop", {
      writable: true,
      configurable: true,
      value: 0,
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders button", async () => {
    render(<BackToTop />);

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Back to top" }),
      ).toBeInTheDocument();
    });
  });

  it("is not visible initially when scroll position is below threshold", async () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    const { container } = render(<BackToTop />);

    await waitFor(() => {
      const button = container.querySelector("button");
      expect(button?.className).not.toContain("visible");
    });
  });

  it("becomes visible when scroll position exceeds threshold", async () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { container } = render(<BackToTop />);

    await act(async () => {
      const scrollEvent = new Event("scroll");
      window.dispatchEvent(scrollEvent);
    });

    await waitFor(() => {
      const button = container.querySelector("button");
      expect(button?.className).toContain("visible");
    });
  });

  it("scrolls to top when clicked", async () => {
    const scrollToSpy = jest.fn();
    window.scrollTo = scrollToSpy;
    const user = userEvent.setup();

    render(<BackToTop />);

    const button = screen.getByRole("button", { name: "Back to top" });
    await user.click(button);

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("updates visibility on scroll", async () => {
    const { container } = render(<BackToTop />);

    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });

    await act(async () => {
      const scrollEvent = new Event("scroll");
      window.dispatchEvent(scrollEvent);
    });

    await waitFor(() => {
      const button = container.querySelector("button");
      expect(button?.className).toContain("visible");
    });
  });

  it("cleans up scroll listener on unmount", async () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(<BackToTop />);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    act(() => {
      unmount();
    });

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });
});
