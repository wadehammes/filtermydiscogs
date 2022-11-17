import { NextRouter } from "next/router";

export const mockedUseRouterReturnValue: NextRouter = {
  locale: "en",
  basePath: "/",
  pathname: "/",
  route: "/",
  query: {},
  asPath: "/",
  push: jest.fn(() => Promise.resolve(true)),
  replace: jest.fn(() => Promise.resolve(true)),
  reload: jest.fn(() => Promise.resolve(true)),
  prefetch: jest.fn(() => Promise.resolve()),
  back: jest.fn(() => Promise.resolve(true)),
  beforePopState: jest.fn(() => Promise.resolve(true)),
  isFallback: false,
  events: {
    on: jest.fn(),
    off: jest.fn(),
    emit: jest.fn(),
  },
  isLocaleDomain: true,
  isReady: true,
  isPreview: false,
  forward: jest.fn(() => Promise.resolve(true)),
};
