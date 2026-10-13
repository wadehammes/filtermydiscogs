import { jest } from "@jest/globals";

export const getMockedExport = <TFn extends (...args: never[]) => unknown>(
  moduleName: string,
  exportName: string,
): jest.MockedFunction<TFn> => {
  const mockedModule =
    jest.requireMock<Record<string, jest.MockedFunction<TFn>>>(moduleName);
  const mockedExport = mockedModule[exportName];

  if (!mockedExport) {
    throw new Error(
      `Expected mock export "${exportName}" on module "${moduleName}"`,
    );
  }

  return mockedExport;
};

export const getMockedModule = <TModule extends Record<string, unknown>>(
  moduleName: string,
): TModule => jest.requireMock<TModule>(moduleName);
