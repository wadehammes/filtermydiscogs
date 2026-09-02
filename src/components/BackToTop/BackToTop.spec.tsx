import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import userEvent from "@testing-library/user-event";
import { BackToTopPageObject } from "src/components/BackToTop/BackToTop.po";
import { act, screen, waitFor } from "test-utils";

let po: BackToTopPageObject;

describe("BackToTop", () => {
  beforeEach(() => {
    po = new BackToTopPageObject();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders component root", async () => {
    po.renderBackToTop();
    await waitFor(() => {
      expect(screen.getByTestId(po.testId)).toBeInTheDocument();
    });
  });

  it("renders button", async () => {
    po.renderBackToTop();

    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: "Back to top" }),
      ).toBeInTheDocument();
    });
  });

  it("is not visible initially when scroll position is below threshold", async () => {
    po.resetScroll(0);

    const { container } = po.renderBackToTop();

    await waitFor(() => {
      const button = container.querySelector("button");
      expect(button?.className).not.toContain("visible");
    });
  });

  it("becomes visible when scroll position exceeds threshold", async () => {
    po.resetScroll(500, 500);

    const { container } = po.renderBackToTop();

    await act(async () => {
      po.scrollElement.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() => {
      const button = container.querySelector("button");
      expect(button?.className).toContain("visible");
    });
  });

  it("scrolls to top when clicked", async () => {
    const scrollToSpy = po.mockScrollTo();
    const user = userEvent.setup();

    po.renderBackToTop();

    const button = screen.getByRole("button", { name: "Back to top" });
    await user.click(button);

    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 0,
      behavior: "smooth",
    });
  });

  it("updates visibility on scroll", async () => {
    const { container } = po.renderBackToTop();

    po.setScrollY(500);

    await act(async () => {
      po.scrollElement.dispatchEvent(new Event("scroll"));
    });

    await waitFor(() => {
      const button = container.querySelector("button");
      expect(button?.className).toContain("visible");
    });
  });

  it("cleans up scroll listener on unmount", async () => {
    const removeEventListenerSpy = jest.spyOn(
      po.scrollElement,
      "removeEventListener",
    );

    const { unmount } = po.renderBackToTop();

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
