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
  typography: {
    fontFamily: ["Assistant", "sans-serif"].join(","),
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
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: "1rem",
          textTransform: "none",
        },
        outlined: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: "1.5rem",
          padding: "0 1.5rem 0 0",
          textAlign: "left",
          lineHeight: 1.25,
          minWidth: "100%",
          overflow: "hidden",
          background: "rgba(255,255,255,0.5)",
          backdropFilter: "blur(5px)",
          letterSpacing: "1px",
          textTransform: "uppercase",
          wordWrap: "normal",
          wordBreak: "break-word",
        },
        contained: {
          lineHeight: 2,
          padding: "6px 16px 5px",
          textTransform: "uppercase",
          letterSpacing: "1px",
        },
      },
    },
  },
};

export const muiTheme = createTheme(themeOptions);
