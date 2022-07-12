import { FontWeight } from "src/interfaces/common.interfaces";
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
    background: ${theme.colors.black};
    color: ${theme.colors.white};
    font-family: 'Space Mono', monospace;
    font-size: 14px;

    @media ${device.tablet} {
      font-size: 16px;
    }
  }
  body {
    line-height: 1;
  }
  img {
    max-width: 100%;
  }
  a {
    color: ${theme.colors.white};
    font-family: inherit;
    text-decoration: underline;
    font-weight: ${FontWeight.Bold};

    &:hover {
      background-color: ${theme.colors.white};
      text-decoration: none;
      color: ${theme.colors.black};
      cursor: pointer;
    }

    &:focus {
      background-color: ${theme.colors.white};
      text-decoration: none;
      color: ${theme.colors.black};
    }
  }
  [hidden], .hidden {
    display: none;
  }
  strong, b {
    font-weight: ${FontWeight.Bold};
  }
`;
