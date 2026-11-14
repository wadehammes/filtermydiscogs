import { afterEach, describe, expect, it, jest } from "@jest/globals";
import {
  getLayoutScrollTopForElement,
  resolveReleaseSimilarPaginationScrollTop,
  scrollReleaseSimilarListToTop,
  scrollReleaseSimilarSectionToStart,
} from "src/components/ReleaseSimilarSidebar/releaseSimilarSidebarScroll.utils";

const linkOffsetParent = (child: HTMLElement, parent: HTMLElement): void => {
  Object.defineProperty(child, "offsetParent", {
    configurable: true,
    get: () => parent,
  });
};

describe("releaseSimilarSidebarScroll", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    jest.restoreAllMocks();
  });

  it("when the aside list is paginated, scrolls the list container to the top", () => {
    const list = document.createElement("div");
    list.scrollTop = 400;

    scrollReleaseSimilarListToTop(list);

    expect(list.scrollTop).toBe(0);
  });

  it("sums offsetTop along the offsetParent chain up to the scroll parent", () => {
    const scrollParent = document.createElement("div");
    const section = document.createElement("section");
    Object.defineProperty(section, "offsetTop", {
      configurable: true,
      value: 320,
    });
    const scrollTarget = document.createElement("div");
    Object.defineProperty(scrollTarget, "offsetTop", {
      configurable: true,
      value: 56,
    });

    section.appendChild(scrollTarget);
    scrollParent.appendChild(section);
    linkOffsetParent(scrollTarget, section);
    linkOffsetParent(section, scrollParent);

    expect(getLayoutScrollTopForElement(scrollTarget, scrollParent)).toBe(376);
  });

  it("prefers layout offset and falls back to visible flush offset", () => {
    const scrollParent = document.createElement("div");
    Object.defineProperty(scrollParent, "scrollTop", {
      configurable: true,
      value: 400,
      writable: true,
    });
    const pin = document.createElement("div");

    jest
      .spyOn(scrollParent, "getBoundingClientRect")
      .mockReturnValue({ top: 80 } as DOMRect);
    jest
      .spyOn(pin, "getBoundingClientRect")
      .mockReturnValue({ top: 200 } as DOMRect);

    expect(resolveReleaseSimilarPaginationScrollTop(scrollParent, pin)).toBe(
      520,
    );
  });

  it("when the inline section is paginated, scrolls to the similar header pin", () => {
    const modal = document.createElement("div");
    modal.setAttribute("data-testid", "fmdReleaseModal");

    const scrollParent = document.createElement("div");
    scrollParent.setAttribute("data-fmd-scroll-modal-content", "");
    Object.defineProperty(scrollParent, "scrollTop", {
      configurable: true,
      value: 900,
      writable: true,
    });
    modal.appendChild(scrollParent);
    document.body.appendChild(modal);

    const section = document.createElement("section");
    Object.defineProperty(section, "offsetTop", {
      configurable: true,
      value: 700,
    });
    scrollParent.appendChild(section);

    const scrollTarget = document.createElement("div");
    scrollTarget.setAttribute("data-fmd-release-similar-scroll-target", "");
    Object.defineProperty(scrollTarget, "offsetTop", {
      configurable: true,
      value: 0,
    });
    section.appendChild(scrollTarget);
    linkOffsetParent(scrollTarget, section);
    linkOffsetParent(section, scrollParent);

    scrollReleaseSimilarSectionToStart(section);

    expect(scrollParent.scrollTop).toBe(700);
  });
});
