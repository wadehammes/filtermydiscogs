import { Box } from "@mui/material";
import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";
import styled from "styled-components";
import Heart from "src/styles/icons/heart-solid.svg";

const PageBackground = styled.div`
  position: fixed;
  inset: 0;
  background: radial-gradient(50% 123.47% at 50% 50%, #00ff94 0%, #720059 100%),
    linear-gradient(121.28deg, #669600 0%, #ff0000 100%),
    linear-gradient(360deg, #0029ff 0%, #8fff00 100%),
    radial-gradient(100% 164.72% at 100% 100%, #6100ff 0%, #00ff57 100%),
    radial-gradient(100% 148.07% at 0% 0%, #fff500 0%, #51d500 100%);
  background-blend-mode: screen, color-dodge, overlay, difference, normal;
  opacity: 0.25;
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
