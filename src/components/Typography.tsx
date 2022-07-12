import { FontWeight } from "src/interfaces/common.interfaces";
import { device } from "src/styles/theme";
import styled from "styled-components";

export const H1 = styled.h1`
  font-size: 1.5rem;
  font-weight: ${FontWeight.Bold};
  padding-bottom: 1.5rem;
  line-height: 1.1;

  @media ${device.tablet} {
    font-size: 3rem;
  }
`;

export const P = styled.p`
  font-weight: ${FontWeight.Regular};
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
