import { QueryClientProvider } from "@tanstack/react-query";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
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

const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: TestProviders, ...options });

export * from "@testing-library/react";

export { customRender as render, renderWithProviders };
