import "@testing-library/jest-dom";
import "jest-canvas-mock";
import "jest-fetch-mock";
import { setupIntersectionObserverMock } from "src/tests/mocks/mockIntersectionObserver.mock";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { mockedUseRouterReturnValue } from "src/tests/mocks/mockNextRouter.mock";

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mock window.location
(window as any).location = {
  href: "http://localhost/",
  origin: "http://localhost",
  protocol: "http:",
  host: "localhost",
  hostname: "localhost",
  port: "",
  pathname: "/",
  search: "",
  hash: "",
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

jest.mock("next/router", () => ({
  useRouter: () => mockedUseRouterReturnValue,
}));

// Mock Next.js app router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    prefetch: jest.fn(),
  }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));

global.beforeAll(() => {
  setupIntersectionObserverMock();
  setupMockMatchMedia();
});

global.afterAll(() => {
  jest.resetAllMocks();
});
