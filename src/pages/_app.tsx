import { AppProps } from "next/app";
import { muiTheme } from "src/styles/mui-theme";
import { theme } from "src/styles/theme";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { GlobalStyles } from "src/styles/global";

const DiscogsCollectionFilter = ({ Component, pageProps }: AppProps) => {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <ThemeProvider theme={theme}>
        <GlobalStyles />
        <Component {...pageProps} />
      </ThemeProvider>
    </MuiThemeProvider>
  );
};

export default DiscogsCollectionFilter;
