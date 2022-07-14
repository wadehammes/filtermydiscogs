import { Box } from "@mui/material";
import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";
import styled from "styled-components";
import Heart from "src/styles/icons/heart-solid.svg";

const PageBackground = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(180deg, #ffb7b7 0%, #727272 100%),
    radial-gradient(60.91% 100% at 50% 0%, #ffd1d1 0%, #260000 100%),
    linear-gradient(127.43deg, #00ffff 0%, #ffffff 100%),
    radial-gradient(100.22% 100% at 70.57% 0%, #ff0000 0%, #00ffe0 100%),
    linear-gradient(64.82deg, #dbff00 0%, #3300ff 100%);
  background-blend-mode: screen, overlay, color-burn, color-dodge, normal;
  opacity: 0.5;
  z-index: -1;
  height: 100vh;
  width: 100vw;
`;

const PageContent = styled.div`
  flex: 1;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
  width: 100%;
  padding: 2rem;
`;

export const Page = forwardRef(
  ({ children }: PropsWithChildrenOnly, ref: Ref<HTMLDivElement>) => {
    return (
      <Box display="flex" flexDirection="column" height="100vh" width="100vw">
        <Helmet />
        <PageBackground />
        <PageContent>{children}</PageContent>
        <Footer>
          <>
            <Heart />{" "}
            <span>
              made with love by{" "}
              <a href="https://wadehammes.com" target="_blank" rel="noreferrer">
                Wade Hammes
              </a>
            </span>
            <span>&copy; {new Date().getFullYear()}</span>
          </>
        </Footer>
      </Box>
    );
  }
);

export default Page;
