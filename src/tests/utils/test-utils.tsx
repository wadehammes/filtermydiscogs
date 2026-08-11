import {
  type RenderHookOptions,
  type RenderOptions,
  render as rtlRender,
  renderHook as rtlRenderHook,
} from "@testing-library/react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import {
  TestProviders,
  type TestProvidersProps,
} from "src/tests/utils/testProviders";

type TestProviderOptions = Pick<
  TestProvidersProps,
  | "authInitialState"
  | "skipInitialAuthCheck"
  | "queryClient"
  | "includeCrate"
  | "includeCollectionSync"
> & {
  wrapper?: ComponentType<{ children: ReactNode }>;
};

interface CustomRenderOptions
  extends Omit<RenderOptions, "queries">,
    TestProviderOptions {
  wrapper?: ComponentType<{ children: ReactNode }>;
}

const buildTestProvidersWrapper =
  (options: TestProviderOptions = {}) =>
  ({ children }: { children: ReactNode }) => (
    <TestProviders
      {...(options.authInitialState !== undefined
        ? { authInitialState: options.authInitialState }
        : {})}
      {...(options.skipInitialAuthCheck !== undefined
        ? { skipInitialAuthCheck: options.skipInitialAuthCheck }
        : {})}
      {...(options.queryClient !== undefined
        ? { queryClient: options.queryClient }
        : {})}
      {...(options.includeCrate !== undefined
        ? { includeCrate: options.includeCrate }
        : {})}
      {...(options.includeCollectionSync !== undefined
        ? { includeCollectionSync: options.includeCollectionSync }
        : {})}
    >
      {children}
    </TestProviders>
  );

const render = (ui: ReactElement, options?: CustomRenderOptions) => {
  const {
    wrapper: Wrapper,
    authInitialState,
    skipInitialAuthCheck,
    queryClient,
    includeCrate,
    includeCollectionSync,
    ...renderOptions
  } = options ?? {};

  const ResolvedWrapper =
    Wrapper ??
    buildTestProvidersWrapper({
      ...(authInitialState !== undefined ? { authInitialState } : {}),
      ...(skipInitialAuthCheck !== undefined ? { skipInitialAuthCheck } : {}),
      ...(queryClient !== undefined ? { queryClient } : {}),
      ...(includeCrate !== undefined ? { includeCrate } : {}),
      ...(includeCollectionSync !== undefined ? { includeCollectionSync } : {}),
    });

  return rtlRender(ui, { wrapper: ResolvedWrapper, ...renderOptions });
};

const renderHookWithTestProviders = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> & TestProviderOptions,
) => {
  const {
    authInitialState,
    skipInitialAuthCheck,
    queryClient,
    includeCrate,
    includeCollectionSync,
    wrapper: UserWrapper,
    ...renderHookOptions
  } = options ?? {};

  const ProviderWrapper = buildTestProvidersWrapper({
    ...(authInitialState !== undefined ? { authInitialState } : {}),
    ...(skipInitialAuthCheck !== undefined ? { skipInitialAuthCheck } : {}),
    ...(queryClient !== undefined ? { queryClient } : {}),
    ...(includeCrate !== undefined ? { includeCrate } : {}),
    ...(includeCollectionSync !== undefined ? { includeCollectionSync } : {}),
  });

  const ComposedWrapper = UserWrapper
    ? ({ children }: { children: ReactNode }) => (
        <ProviderWrapper>
          <UserWrapper>{children}</UserWrapper>
        </ProviderWrapper>
      )
    : ProviderWrapper;

  return rtlRenderHook(hook, {
    ...renderHookOptions,
    wrapper: ComposedWrapper,
  });
};

const renderFeatureHook = <TProps, TResult>(
  hook: (props: TProps) => TResult,
  options?: Omit<RenderHookOptions<TProps>, "wrapper"> &
    Omit<TestProviderOptions, "includeCrate"> &
    Pick<TestProviderOptions, "includeCrate">,
) =>
  renderHookWithTestProviders(hook, {
    includeCrate: false,
    ...options,
  });

export * from "@testing-library/react";

export {
  render,
  renderFeatureHook,
  renderHookWithTestProviders,
  TestProviders,
};
