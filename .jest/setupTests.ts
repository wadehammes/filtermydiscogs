import { afterAll, beforeAll, beforeEach } from "@jest/globals";
import "@testing-library/jest-dom/jest-globals";
import { TextEncoder } from "node:util";
import fetchMock from "jest-fetch-mock";
import "src/tests/mocks/mockCanvas.mock";
import React from "react";
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
  setupIntersectionObserverMock();
  setupMockMatchMedia();
});

beforeEach(() => {
  jest.clearAllTimers();

  jest.clearAllMocks();
  fetchMock.resetMocks();
  setupMockMatchMedia();
  window.scrollTo = jest.fn();
});

afterAll(() => {
  jest.resetAllMocks();
});
