import { beforeEach, describe, expect, it } from "@jest/globals";
import {
  lockDocumentForOverlayScroll,
  restoreDocumentOverlayScroll,
} from "./documentScrollLock";

describe("documentScrollLock", () => {
  let scrollYValue = 0;

  beforeEach(() => {
    document.documentElement.removeAttribute("style");
    document.body.removeAttribute("style");
    scrollYValue = 0;
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      get: () => scrollYValue,
    });
  });

  it("fixes the document while locked and restores scroll position when released", () => {
    scrollYValue = 120;

    const snapshot = lockDocumentForOverlayScroll();
    const scrollToSpy = jest
      .spyOn(window, "scrollTo")
      .mockImplementation(() => {});

    expect(document.documentElement.style.overflow).toBe("hidden");
    expect(document.documentElement.style.position).toBe("fixed");
    expect(document.documentElement.style.top).toBe("-120px");
    expect(document.body.style.overflow).toBe("hidden");

    restoreDocumentOverlayScroll(snapshot);

    expect(document.documentElement.style.overflow).toBe("");
    expect(document.documentElement.style.position).toBe("");
    expect(document.body.style.overflow).toBe("");
    expect(scrollToSpy).toHaveBeenCalledWith({
      top: 120,
      left: 0,
    });

    scrollToSpy.mockRestore();
  });
});
