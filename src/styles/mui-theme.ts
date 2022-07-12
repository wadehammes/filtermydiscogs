import { ThemeOptions } from "@mui/material";
import { createTheme } from "@mui/material/styles";

export const themeOptions: ThemeOptions = {
  palette: {
    primary: {
      main: "#171717",
    },
    secondary: {
      main: "#87ee",
    },
    success: {
      main: "#99FF00",
    },
    text: {
      primary: "#171717",
    },
  },
  components: {
    MuiFormControlLabel: {
      styleOverrides: {
        root: {
          display: "flex",
          justifyContent: "space-between",
          width: "100%",
        },
      },
    },
  },
};

export const muiTheme = createTheme(themeOptions);
