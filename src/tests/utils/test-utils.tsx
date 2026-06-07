import {
  type RenderOptions,
  render as rtlRender,
} from "@testing-library/react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import {
  TestProviders,
  type TestProvidersProps,
} from "src/tests/utils/testProviders";

interface CustomRenderOptions
  extends Omit<RenderOptions, "queries">,
    Pick<TestProvidersProps, "authInitialState" | "skipInitialAuthCheck"> {
  wrapper?: ComponentType<{ children: ReactNode }>;
}

const render = (ui: ReactElement, options?: CustomRenderOptions) => {
  const {
    wrapper: Wrapper,
    authInitialState,
    skipInitialAuthCheck,
    ...renderOptions
  } = options ?? {};

  const ResolvedWrapper =
    Wrapper ??
    (({ children }: { children: ReactNode }) => (
      <TestProviders
        {...(authInitialState !== undefined ? { authInitialState } : {})}
        {...(skipInitialAuthCheck !== undefined
          ? { skipInitialAuthCheck }
          : {})}
      >
        {children}
      </TestProviders>
    ));

  return rtlRender(ui, { wrapper: ResolvedWrapper, ...renderOptions });
};

export * from "@testing-library/react";

export { render, TestProviders };
