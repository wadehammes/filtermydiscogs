import type { AppRouterInstance } from "next/dist/shared/lib/app-router-context.shared-runtime";

export const createMockAppRouter = (
  overrides: Partial<AppRouterInstance> = {},
): AppRouterInstance => ({
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
  push: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
  bfcacheId: "",
  ...overrides,
});
