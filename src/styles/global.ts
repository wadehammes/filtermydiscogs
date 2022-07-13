import { device, theme } from "src/styles/theme";
import { createGlobalStyle } from "styled-components";

export const GlobalStyles = createGlobalStyle`
  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }
  html, body, div, span, applet, object, iframe,
  h1, h2, h3, h4, h5, h6, p, blockquote, pre,
  a, abbr, acronym, address, big, cite, code,
  del, dfn, em, img, ins, kbd, q, s, samp,
  small, strike, strong, sub, sup, tt, var,
  b, u, i, center,
  dl, dt, dd, ol, ul, li,
  fieldset, form, label, legend,
  table, caption, tbody, tfoot, thead, tr, th, td,
  article, aside, canvas, details, embed, 
  figure, figcaption, footer, header, hgroup, 
  menu, nav, output, ruby, section, summary,
  time, mark, audio, video {
    margin: 0;
    padding: 0;
    border: 0;
    font: inherit;
    font-size: 100%;
    vertical-align: baseline;
  }
  html,
  body {
    padding: 0;
    color: ${theme.colors.black};
    font-size: 14px;
    font-family: "Helvetica", 'Courier New', Courier, monospace, sans-serif;

    @media ${device.tablet} {
      font-size: 16px;
    }
  }
  body {
    line-height: 1;
    background-color: #dcf8ef;
    min-height: 100vh;
  }
  img {
    max-width: 100%;
  }
  [hidden], .hidden {
    display: none;
  }
  strong, b {
    font-weight: bold;
  }
  button {
    cursor: pointer;
  }
`;
