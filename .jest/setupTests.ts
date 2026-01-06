import "@testing-library/jest-dom";
import "jest-canvas-mock";
import "jest-fetch-mock";
import React from "react";
import { setupIntersectionObserverMock } from "src/tests/mocks/mockIntersectionObserver.mock";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { mockedUseRouterReturnValue } from "src/tests/mocks/mockNextRouter.mock";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

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

global.beforeAll(() => {
  setupIntersectionObserverMock();
  setupMockMatchMedia();
});

// Ensure matchMedia is always available, even after resetAllMocks
global.beforeEach(() => {
  setupMockMatchMedia();
});

global.afterAll(() => {
  jest.resetAllMocks();
});
