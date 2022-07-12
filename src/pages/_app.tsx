import { AppProps } from "next/app";
import { muiTheme } from "src/styles/mui-theme";
import { theme } from "src/styles/theme";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";

const DiscogsCollectionFilter = ({ Component, pageProps }: AppProps) => {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <ThemeProvider theme={theme}>
        <Component {...pageProps} />
      </ThemeProvider>
    </MuiThemeProvider>
  );
};

export default DiscogsCollectionFilter;
