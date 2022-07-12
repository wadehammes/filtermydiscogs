import { jest } from "@jest/globals";
import "@testing-library/jest-dom/extend-expect";
import "jest-canvas-mock";
import "jest-fetch-mock";
import "jest-location-mock";
import { mocked, MockedFunctionDeep } from "jest-mock";
import { NextRouter } from "next/router";
import { sendFeatureFlagIdentifyEvent } from "src/api/sendFeatureFlagIdentifyEvent";
import { UserIdentify } from "src/api/urls";
import { setupIntersectionObserverMock } from "src/tests/mocks/mockIntersectionObserver.mock";
import { setupMockMatchMedia } from "src/tests/mocks/mockMatchMedia.mock";
import { mockedUseRouterReturnValue } from "src/tests/mocks/mockNextRouter.mock";

declare global {
  var mockSendFeatureFlagIdentifyEvent: MockedFunctionDeep<
    ({ key, custom }: UserIdentify) => Promise<boolean>
  >;
  var tatari: {
    track: (event: string, context: Record<string, unknown>) => void;
    identify: (id: string) => void;
  };
  var IS_REACT_ACT_ENVIRONMENT: boolean;
  var _fs_initialized: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

jest.mock("src/api/sendFeatureFlagIdentifyEvent");
const mockSendFeatureFlagIdentifyEvent = mocked(
  sendFeatureFlagIdentifyEvent,
  true
);

jest.mock("next/router", () => ({
  useRouter: () => mockedUseRouterReturnValue,
}));

global.mockSendFeatureFlagIdentifyEvent = mockSendFeatureFlagIdentifyEvent;

global.tatari = {
  track: () => {},
  identify: () => {},
};

global.beforeAll(() => {
  setupIntersectionObserverMock();
  setupMockMatchMedia();

  global.mockSendFeatureFlagIdentifyEvent;
});

global.afterAll(() => {
  jest.resetAllMocks();
});
