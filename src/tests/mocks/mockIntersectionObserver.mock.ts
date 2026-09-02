export type IntersectionObserverMockControls = {
  triggerIntersection: (target: Element, isIntersecting?: boolean) => void;
  getObservedElements: () => Element[];
  getLastObserverRoot: () => Element | Document | null;
  reset: () => void;
};

type SetupIntersectionObserverMockOptions = {
  root?: Element | null;
  rootMargin?: string;
  thresholds?: number[];
  disconnect?: () => void;
  observe?: (target: Element) => void;
  takeRecords?: () => IntersectionObserverEntry[];
  unobserve?: (target: Element) => void;
};

export function setupIntersectionObserverMock({
  root = null,
  rootMargin = "",
  thresholds = [],
  disconnect = () => null,
  observe,
  takeRecords = () => [],
  unobserve = () => null,
}: SetupIntersectionObserverMockOptions = {}): IntersectionObserverMockControls {
  const observedElements: Element[] = [];
  let callback: IntersectionObserverCallback | null = null;
  let lastRoot: Element | Document | null = root;
  let observerInstance: IntersectionObserver | null = null;

  class MockIntersectionObserver implements IntersectionObserver {
    readonly root: Element | null = root;
    readonly rootMargin: string = rootMargin;
    readonly scrollMargin: string = "";
    readonly thresholds: ReadonlyArray<number> =
      thresholds.length > 0 ? thresholds : [0];

    constructor(
      intersectionCallback: IntersectionObserverCallback,
      options?: IntersectionObserverInit,
    ) {
      callback = intersectionCallback;
      lastRoot = options?.root ?? root;
      observerInstance = this;
    }

    disconnect: () => void = disconnect;

    observe: (target: Element) => void = (target: Element) => {
      observedElements.push(target);
      observe?.(target);
    };

    takeRecords: () => IntersectionObserverEntry[] = takeRecords;
    unobserve: (target: Element) => void = unobserve;
  }

  Object.defineProperty(window, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  Object.defineProperty(global, "IntersectionObserver", {
    writable: true,
    configurable: true,
    value: MockIntersectionObserver,
  });

  return {
    triggerIntersection: (target: Element, isIntersecting = true) => {
      callback?.(
        [
          {
            isIntersecting,
            target,
            intersectionRatio: isIntersecting ? 1 : 0,
            boundingClientRect: target.getBoundingClientRect(),
            intersectionRect: target.getBoundingClientRect(),
            rootBounds: null,
            time: Date.now(),
          } as IntersectionObserverEntry,
        ],
        observerInstance as IntersectionObserver,
      );
    },
    getObservedElements: () => [...observedElements],
    getLastObserverRoot: () => lastRoot,
    reset: () => {
      observedElements.length = 0;
      callback = null;
      lastRoot = root;
      observerInstance = null;
    },
  };
}
