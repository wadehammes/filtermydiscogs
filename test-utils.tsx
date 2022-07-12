import { RenderOptions, render } from "@testing-library/react";
import i18n from "i18next.config";
import { RouterContext } from "next/dist/shared/lib/router-context";
import React, { FC, ReactElement } from "react";
import { I18nextProvider } from "react-i18next";
import { UIContext } from "src/context/ui.context";
import { theme } from "src/styles/theme";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { muiTheme } from "src/styles/mui-theme";
import { FeatureFlagClientProvider } from "src/context/featureFlagClient.context";
import { PropsWithChildrenOnly } from "src/@types/react";
import { mockedUseRouterReturnValue } from "src/tests/mocks/mockNextRouter.mock";
import { mockUiContext } from "src/tests/mocks/mockUiContext.mock";

const Providers: FC<PropsWithChildrenOnly> = ({ children }) => {
  return (
    <RouterContext.Provider value={mockedUseRouterReturnValue}>
      <FeatureFlagClientProvider featureFlagUserId="rh-test">
        <UIContext.Provider value={mockUiContext}>
          <I18nextProvider i18n={i18n}>
            <MuiThemeProvider theme={muiTheme}>
              <ThemeProvider theme={theme}>{children}</ThemeProvider>
            </MuiThemeProvider>
          </I18nextProvider>
        </UIContext.Provider>
      </FeatureFlagClientProvider>
    </RouterContext.Provider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, "queries">
) => render(ui, { wrapper: Providers, ...options });

export * from "@testing-library/react";

export { customRender as render };
