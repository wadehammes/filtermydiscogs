import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";
import styled from "styled-components";

const PageBackground = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(238.72deg, #ebff00 0%, #8f00ff 100%),
    linear-gradient(64.82deg, #ad00ff 0%, #ff0000 100%),
    linear-gradient(65.03deg, #00ffff 0%, #ff0000 99.79%),
    radial-gradient(67.08% 100% at 50% 100%, #ff00c7 0%, #50005e 100%),
    radial-gradient(100% 140% at 100% 0%, #5ed500 0%, #2200aa 100%);
  background-blend-mode: color-dodge, difference, lighten, color-dodge, normal;
  opacity: 0.35;
  z-index: -1;
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
