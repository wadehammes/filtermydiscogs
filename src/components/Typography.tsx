import { device } from "src/styles/device";
import styled from "styled-components";

export const H1 = styled.h1`
  font-size: 1.25rem;
  font-weight: bold;
  line-height: 1;
  font-family: inherit;
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
export const OL = styled.ol`
  display: flex;
  flex-flow: column wrap;
  align-items: stretch;
  gap: 1.25rem;
  padding-left: 0;
  list-style-type: none;

  @media ${device.tablet} {
    flex-flow: row wrap;
  }
`;

export const LI = styled.li`
  line-height: 2.25;
  padding: 0;
  text-align: left;
  font-weight: normal;
  width: 100%;
`;
