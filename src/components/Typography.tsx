import { device } from "src/styles/theme";
import styled from "styled-components";

export const H1 = styled.h1`
  font-size: 1rem;
  font-weight: bold;
  line-height: 1;
  font-family: Sans-serif;
`;

export const P = styled.p`
  font-weight: normal;
  line-height: 1.5;
  padding-bottom: 1.5rem;
  font-size: 1rem;

  @media ${device.tablet} {
    font-size: 1.15rem;
  }

  &:empty {
    display: none;
    padding: 0;
  }
`;

export const UL = styled.ul``;
export const OL = styled.ol``;

export const LI = styled.li`
  line-height: 2.25;
  padding: 0.5rem 0 0 1rem;
`;
