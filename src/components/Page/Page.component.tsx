import { forwardRef, Ref } from "react";
import { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";

export const Page = forwardRef(
  ({ children }: PropsWithChildrenOnly, ref: Ref<HTMLDivElement>) => {
    return (
      <>
        <Helmet />
        {children}
      </>
    );
  }
);

export default Page;
