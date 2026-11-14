const RELEASE_MODAL_SCROLL_CONTENT_SELECTOR = "[data-fmd-scroll-modal-content]";

const RELEASE_SIMILAR_SCROLL_TARGET_SELECTOR =
  "[data-fmd-release-similar-scroll-target]";

const RELEASE_MODAL_ROOT_SELECTOR =
  '[data-testid="fmdReleaseModal"], [data-testid="fmdPublicReleaseModal"]';

const isVerticalScrollContainer = (element: HTMLElement): boolean => {
  const { overflowY } = getComputedStyle(element);

  return overflowY === "auto" || overflowY === "scroll";
};

export const getReleaseSimilarOverflowScrollParent = (
  node: HTMLElement | null,
): HTMLElement | null => {
  let element = node?.parentElement ?? null;

  while (element) {
    if (isVerticalScrollContainer(element)) {
      return element;
    }

    element = element.parentElement;
  }

  return null;
};

export const resolveReleaseSimilarScrollParent = (
  node: HTMLElement,
): HTMLElement | null => {
  const modal = node.closest<HTMLElement>(RELEASE_MODAL_ROOT_SELECTOR);
  const scrollContent = modal?.querySelector<HTMLElement>(
    RELEASE_MODAL_SCROLL_CONTENT_SELECTOR,
  );

  if (scrollContent) {
    return scrollContent;
  }

  return getReleaseSimilarOverflowScrollParent(node);
};

export const getLayoutScrollTopForElement = (
  element: HTMLElement,
  scrollParent: HTMLElement,
): number => {
  if (!scrollParent.contains(element)) {
    return 0;
  }

  let offsetTop = 0;
  let node: HTMLElement | null = element;

  while (node && node !== scrollParent) {
    offsetTop += node.offsetTop;
    const nextOffsetParent: Element | null = node.offsetParent;

    if (!(nextOffsetParent instanceof HTMLElement)) {
      return 0;
    }

    if (nextOffsetParent === scrollParent) {
      return offsetTop;
    }

    if (!scrollParent.contains(nextOffsetParent)) {
      return 0;
    }

    node = nextOffsetParent;
  }

  return offsetTop;
};

const getVisibleScrollTopForElement = (
  element: HTMLElement,
  scrollParent: HTMLElement,
): number => {
  const scrollRootRect = scrollParent.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();

  return scrollParent.scrollTop + (elementRect.top - scrollRootRect.top);
};

export const resolveReleaseSimilarPaginationScrollTop = (
  scrollParent: HTMLElement,
  pinElement: HTMLElement,
): number => {
  const layoutScrollTop = getLayoutScrollTopForElement(
    pinElement,
    scrollParent,
  );

  if (layoutScrollTop > 0) {
    return layoutScrollTop;
  }

  return getVisibleScrollTopForElement(pinElement, scrollParent);
};

const applyScrollTop = (scrollParent: HTMLElement, top: number): void => {
  if (!Number.isFinite(top)) {
    return;
  }

  const targetTop = Math.max(0, top);

  scrollParent.scrollTop = targetTop;
};

export const scrollReleaseSimilarSectionToStart = (
  sectionRoot: HTMLElement,
): void => {
  const scrollParent = resolveReleaseSimilarScrollParent(sectionRoot);

  if (!scrollParent) {
    if (typeof sectionRoot.scrollIntoView === "function") {
      sectionRoot.scrollIntoView({ behavior: "auto", block: "start" });
    }

    return;
  }

  const pinElement =
    sectionRoot.querySelector<HTMLElement>(
      RELEASE_SIMILAR_SCROLL_TARGET_SELECTOR,
    ) ?? sectionRoot;

  const scrollTop = resolveReleaseSimilarPaginationScrollTop(
    scrollParent,
    pinElement,
  );

  applyScrollTop(scrollParent, scrollTop);
};

export const scrollReleaseSimilarListToTop = (
  listRoot: HTMLElement | null,
): void => {
  if (!listRoot) {
    return;
  }

  applyScrollTop(listRoot, 0);
};
