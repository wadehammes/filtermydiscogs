import { render, screen } from "@testing-library/react";
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

  it("renders button", () => {
    render(<BackToTop />);
    expect(
      screen.getByRole("button", { name: "Back to top" }),
    ).toBeInTheDocument();
  });

  it("is not visible initially when scroll position is below threshold", () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 0,
    });

    const { container } = render(<BackToTop />);
    const button = container.querySelector("button");

    expect(button?.className).not.toContain("visible");
  });

  it("becomes visible when scroll position exceeds threshold", () => {
    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const { container, rerender } = render(<BackToTop />);

    const scrollEvent = new Event("scroll");
    window.dispatchEvent(scrollEvent);

    rerender(<BackToTop />);

    const button = container.querySelector("button");
    expect(button?.className).toContain("visible");
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

  it("updates visibility on scroll", () => {
    const { container, rerender } = render(<BackToTop />);

    Object.defineProperty(window, "scrollY", {
      writable: true,
      configurable: true,
      value: 500,
    });

    const scrollEvent = new Event("scroll");
    window.dispatchEvent(scrollEvent);

    rerender(<BackToTop />);

    const button = container.querySelector("button");
    expect(button?.className).toContain("visible");
  });

  it("cleans up scroll listener on unmount", () => {
    const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");

    const { unmount } = render(<BackToTop />);

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "scroll",
      expect.any(Function),
    );
  });
});
