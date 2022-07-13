import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";
import styled from "styled-components";

const PageBackground = styled.div`
  position: fixed;
  inset: 0;
  background-image: linear-gradient(315deg, #fee2f8 0%, #dcf8ef 74%);
  z-index: 0;
  height: 100vh;
  width: 100vw;
`;

export const Page = forwardRef(
  ({ children }: PropsWithChildrenOnly, ref: Ref<HTMLDivElement>) => {
    return (
      <>
        <Helmet />
        <PageBackground />
        {children}
      </>
    );
  }
);

export default Page;
