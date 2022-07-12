import { jest } from "@jest/globals";
import "@testing-library/jest-dom/extend-expect";
import "jest-canvas-mock";
import "jest-fetch-mock";
import "jest-location-mock";
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

global.beforeAll(() => {
  setupIntersectionObserverMock();
  setupMockMatchMedia();
});

global.afterAll(() => {
  jest.resetAllMocks();
});
