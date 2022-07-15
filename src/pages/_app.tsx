import { AppProps } from "next/app";
import { muiTheme } from "src/styles/mui-theme";
import { ThemeProvider as MuiThemeProvider } from "@mui/material/styles";
import { GlobalStyles } from "src/styles/global";
import { CollectionContextProvider } from "src/context/collection.context";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { trackPageView } from "src/analytics/analytics";

const App = ({ Component, pageProps }: AppProps) => {
  const { asPath } = useRouter();

  useEffect(() => {
    trackPageView(asPath);
  }, [asPath]);

  return (
    <MuiThemeProvider theme={muiTheme}>
      <CollectionContextProvider>
        <GlobalStyles />
        <Component {...pageProps} />
      </CollectionContextProvider>
    </MuiThemeProvider>
  );
};

export default App;
