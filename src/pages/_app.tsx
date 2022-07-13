import { AppProps } from "next/app";
import { muiTheme } from "src/styles/mui-theme";
import { theme } from "src/styles/theme";
import { ThemeProvider } from "styled-components";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { GlobalStyles } from "src/styles/global";
import { CollectionContextProvider } from "src/context/collection.context";

const DiscogsCollectionFilter = ({ Component, pageProps }: AppProps) => {
  return (
    <MuiThemeProvider theme={muiTheme}>
      <ThemeProvider theme={theme}>
        <CollectionContextProvider>
          <GlobalStyles />
          <Component {...pageProps} />
        </CollectionContextProvider>
      </ThemeProvider>
    </MuiThemeProvider>
  );
};

export default DiscogsCollectionFilter;
