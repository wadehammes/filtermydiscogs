import userEvent from "@testing-library/user-event";
import { act, screen, waitFor } from "src/tests/utils/test-utils";
import { BackToTopPageObject } from "./BackToTop.po";

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
    po.resetScroll(500);

    const { container } = po.renderBackToTop();

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
