import styled from "styled-components";
import { P } from "src/components/Typography";
import { device } from "src/styles/device";

export const Container = styled.div`
  width: 100%;
`;

export const Content = styled(Container)`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-flow: column nowrap;
  height: 100%;
  padding: 0 2rem 4rem;
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
  align-items: flex-start;
  justify-content: flex-start;
  flex-flow: column wrap;
  gap: 1rem;
  background: var(--white);
  position: sticky;
  top: 0;
  width: 100%;
  padding: 1rem 2rem;
  border-bottom: 1px solid var(--gray);
  z-index: 999;

  @media ${device.tablet} {
    padding: 0.75rem 2rem 0.85rem;
    flex-flow: row wrap;
    align-items: center;
  }

  > *:not(h1) {
    flex: 1;
  }
`;
