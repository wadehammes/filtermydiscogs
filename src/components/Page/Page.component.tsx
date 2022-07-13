import { Box } from "@mui/material";
import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";
import styled from "styled-components";
import Heart from "src/styles/icons/heart-solid.svg";

const PageBackground = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(125deg, #fdff9c 0%, #0500ff 100%),
    linear-gradient(180deg, #d3d3d3 0%, #161616 100%),
    linear-gradient(
      310deg,
      #00f0ff 0%,
      #00f0ff 20%,
      #0017e3 calc(20% + 1px),
      #0017e3 40%,
      #000f8f calc(40% + 1px),
      #000f8f 70%,
      #00073f calc(70% + 1px),
      #00073f 100%
    ),
    linear-gradient(
      285deg,
      #ffb6b9 0%,
      #ffb6b9 35%,
      #fae3d9 calc(35% + 1px),
      #fae3d9 45%,
      #bbded6 calc(45% + 1px),
      #bbded6 65%,
      #61c0bf calc(65% + 1px),
      #61c0bf 100%
    );
  background-blend-mode: overlay, overlay, exclusion, normal;
  opacity: 0.8;
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
