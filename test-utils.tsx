import { QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ComponentType, ReactElement, ReactNode } from "react";
import { useMemo } from "react";
import { TestProviders } from "src/tests/utils/testProviders";
import { createTestQueryClient } from "src/tests/utils/testQueryClient";

const QueryClientWrapper = ({ children }: { children: ReactNode }) => {
  const queryClient = useMemo(() => createTestQueryClient(), []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: QueryClientWrapper, ...options });

interface RenderWithProvidersOptions extends Omit<RenderOptions, "queries"> {
  wrapper?: ComponentType<{ children: ReactNode }>;
}

const renderWithProviders = (
  ui: ReactElement,
  options?: RenderWithProvidersOptions,
) => {
  const { wrapper, ...renderOptions } = options || {};
  return render(ui, { wrapper: wrapper || TestProviders, ...renderOptions });
};

export * from "@testing-library/react";

export { customRender as render, renderWithProviders };
