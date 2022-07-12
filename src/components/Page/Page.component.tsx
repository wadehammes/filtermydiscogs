import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Content } from "src/components/Layout";
import { Helmet } from "src/components/Page/Helmet.component";

export const Page = forwardRef(
  ({ children }: PropsWithChildrenOnly, ref: Ref<HTMLDivElement>) => {
    return (
      <>
        <Helmet />
        <Content>{children}</Content>
      </>
    );
  }
);

export default Page;
