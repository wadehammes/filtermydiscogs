export const theme = {
  colors: {
    gray: "#7E888C",
    black: "#393d3f",
    white: "#fdfdff",
    silver: "#c6c5b9",
    teal: "#62929e",
    blue: "#546a7b",
    green: "hsla(145,55%,58%,1)",
    red: "hsla(350,95%,58%,0.83)",
    purple: "hsla(229,94%,76%,0.915)",
    trueBlack: "hsla(5,92%,1%,0.83)",
    alphaBlack: "rgba(0, 0, 0, 0.25)",
  },
  sizing: {
    mobilePadding: "1.75em",
    desktopPadding: "5em",
  },
};

export const breakpoints = {
  mobileS: "384px",
  mobileM: "576px",
  mobileL: "672px",
  tablet: "768px",
  tabletVert: "700px",
  laptopVert: "960px",
  laptop: "1120px",
  desktop: "1440px",
  desktopM: "1920px",
  desktopL: "2560px",
};

export const device = {
  mobileS: `(min-width: ${breakpoints.mobileS})`,
  mobileM: `(min-width: ${breakpoints.mobileM})`,
  mobileL: `(min-width: ${breakpoints.mobileL})`,
  tablet: `(min-width: ${breakpoints.tablet})`,
  tabletVert: `(min-height: ${breakpoints.tabletVert})`,
  laptop: `(min-width: ${breakpoints.laptop})`,
  laptopVert: `(min-height: ${breakpoints.laptopVert})`,
  desktop: `(min-width: ${breakpoints.desktop})`,
  desktopM: `(min-width: ${breakpoints.desktopM})`,
  desktopL: `(min-width: ${breakpoints.desktop})`,
};
