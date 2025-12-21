import { forwardRef, type Ref } from "react";
import type { PropsWithChildrenOnly } from "src/@types/react";
import styles from "./Page.module.css";

export const Page = forwardRef(
  ({ children }: PropsWithChildrenOnly, _ref: Ref<HTMLDivElement>) => {
    return (
      <div className={styles.pageContainer}>
        <div className={styles.pageContent}>{children}</div>
      </div>
    );
  },
);

export default Page;
Page.displayName = "Page";
