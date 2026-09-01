import { afterAll, beforeAll, beforeEach } from "@jest/globals";
import "@testing-library/jest-dom/jest-globals";
import { TextEncoder } from "node:util";
import fetchMock from "jest-fetch-mock";
import {
  replaceHistory,
  replaceLocation,
  reset as resetWindowLocation,
} from "jest-location-mock/hooks/jest";
import "src/tests/mocks/mockCanvas.mock";
import React from "react";
import { ANALYTICS_CONSENT_STORAGE_KEY } from "src/constants/storageKeys";
import { setupIntersectionObserverMock } from "src/tests/mocks/mockIntersectionObserver.mock";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { mockedUseRouterReturnValue } from "src/tests/mocks/mockNextRouter.mock";

global.TextEncoder = TextEncoder as typeof global.TextEncoder;

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  };
}

if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }

  globalThis.PointerEvent =
    PointerEventPolyfill as typeof globalThis.PointerEvent;
}

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

fetchMock.enableMocks();

jest.mock("next/router", () => ({
  useRouter: () => mockedUseRouterReturnValue,
}));

jest.mock("next/navigation", () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  })),
  usePathname: jest.fn(() => "/"),
  useSearchParams: jest.fn(() => new URLSearchParams()),
  unstable_rethrow: jest.fn(),
}));

jest.mock("usehooks-ts", () => ({
  useMediaQuery: jest.fn(() => false),
}));

jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: {
    src: string;
    alt: string;
    width?: number;
    height?: number;
    priority?: boolean;
    className?: string;
    [key: string]: unknown;
  }) => {
    // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
    return React.createElement("img", {
      src: props.src,
      alt: props.alt,
      className: props.className,
    });
  },
}));

const originalWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = typeof args[0] === "string" ? args[0] : "";
  if (
    msg.includes("quality") &&
    msg.includes("images.qualities") &&
    msg.includes("next-image-unconfigured-qualities")
  ) {
    return;
  }
  originalWarn.apply(console, args);
};

beforeAll(() => {
  replaceLocation();
  replaceHistory();
  setupIntersectionObserverMock();
  setupMockMatchMedia();

  const baseUiTestStyles = document.createElement("style");
  baseUiTestStyles.textContent = `
    [data-starting-style],
    [data-ending-style] {
      opacity: 1 !important;
      pointer-events: auto !important;
      transform: none !important;
    }
  `;
  document.head.appendChild(baseUiTestStyles);
});

beforeEach(() => {
  resetWindowLocation();
  jest.clearAllTimers();

  jest.clearAllMocks();
  fetchMock.resetMocks();
  setupMockMatchMedia();
  window.scrollTo = jest.fn();
  localStorage.setItem(ANALYTICS_CONSENT_STORAGE_KEY, "denied");
  jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({
    x: 100,
    y: 200,
    width: 240,
    height: 44,
    top: 200,
    left: 100,
    right: 340,
    bottom: 244,
    toJSON: () => {},
  } as DOMRect);
});

afterAll(() => {
  jest.resetAllMocks();
});
