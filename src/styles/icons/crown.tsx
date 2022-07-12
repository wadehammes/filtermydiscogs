import styled from "styled-components";

const CrownWrapper = styled.span`
  display: block;
  fill: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.white};
`;

export const Crown = () => (
  <CrownWrapper>
    <svg id="crown" viewBox="0 0 79.35 39.71">
      <path d="M39 39c.4.4.3.7-.3.7h-28a1.27 1.27 0 01-1.2-1L0 .51c-.1-.5.1-.7.5-.3z" />
      <path d="M10.83 39.71c-.5 0-.7-.3-.3-.7L39 10.81a1 1 0 011.4 0L68.83 39c.4.4.3.7-.3.7z" />
      <path d="M40.43 39c-.4.4-.3.7.3.7h27.9a1.27 1.27 0 001.2-1L79.33.51c.1-.5-.1-.7-.5-.3z" />
    </svg>
  </CrownWrapper>
);
