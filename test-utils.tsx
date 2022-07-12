import { RenderOptions, render } from "@testing-library/react";
import { RouterContext } from "next/dist/shared/lib/router-context";
import React, { FC, ReactElement } from "react";
import { theme } from "src/styles/theme";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { muiTheme } from "src/styles/mui-theme";
import { PropsWithChildrenOnly } from "src/@types/react";
import { mockedUseRouterReturnValue } from "src/tests/mocks/mockNextRouter.mock";

const Providers: FC<PropsWithChildrenOnly> = ({ children }) => {
  return (
    <RouterContext.Provider value={mockedUseRouterReturnValue}>
      <MuiThemeProvider theme={muiTheme}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </MuiThemeProvider>
    </RouterContext.Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";

export { customRender as render };
