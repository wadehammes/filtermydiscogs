import { type RenderOptions, render } from "@testing-library/react";
import type React from "react";
import type { FC, ReactElement } from "react";

const Providers: FC<{ children: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">,
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";

export { customRender as render };
