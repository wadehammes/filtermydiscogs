import {
  type RenderOptions,
  render as rtlRender,
} from "@testing-library/react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { TestProviders } from "src/tests/utils/testProviders";

interface CustomRenderOptions extends Omit<RenderOptions, "queries"> {
  wrapper?: ComponentType<{ children: ReactNode }>;
}

const render = (ui: ReactElement, options?: CustomRenderOptions) => {
  const { wrapper: Wrapper = TestProviders, ...renderOptions } = options ?? {};

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
};

export * from "@testing-library/react";

export { render, TestProviders };
