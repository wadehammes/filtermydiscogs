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
  width: 100%;
`;

export const Content = styled(Container)`
  display: flex;
  align-items: flex-end;
  justify-content: flex-start;
  height: 100%;
  padding: 0 4rem 3rem;
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

export const StickyHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  background: white;
  position: sticky;
  top: 0;
  width: 100%;
  padding: 0.75rem 1rem 0.9rem;
  border-bottom: 1px solid lightgray;

  > *:not(h1) {
    min-width: 20em;
  }
`;
