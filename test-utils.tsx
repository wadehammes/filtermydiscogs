import { type RenderOptions, render } from "@testing-library/react";
import type React from "react";
import type { FC, ReactElement } from "react";
import { TestProviders } from "src/tests/utils/testProviders";

const Providers: FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: Providers, ...options });

const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: TestProviders, ...options });

export * from "@testing-library/react";

export { customRender as render, renderWithProviders };
