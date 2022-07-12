import { device } from "src/styles/theme";
import styled from "styled-components";
import { P } from "src/components/Typography";

interface GridProps {
  gridHeight?: number | null;
}

export const Grid = styled.div<GridProps>`
  display: grid;
  grid-template-rows: 8em 1fr;
  grid-gap: 0;
  height: ${({ gridHeight = 500 }) =>
    gridHeight ? `${gridHeight}px` : "100vh"};
  width: 100%;
`;

export const Container = styled.div`
  padding: ${({ theme }) => theme.sizing.mobilePadding};
  width: 100%;

  @media ${device.tablet} {
    padding: ${({ theme }) => theme.sizing.desktopPadding};
  }
`;

export const Content = styled(Container)`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  height: 100%;
`;

export const Footer = styled.footer`
  position: relative;
  display: flex;
  justify-content: flex-start;
  align-items: flex-start;
  flex-direction: column;
  width: 100%;
  z-index: 1;

  ${P} {
    max-width: 70ch;
  }
`;
