import type { Ref } from "react";
import type { PropsWithChildrenOnly } from "src/@types/react";
import styles from "./Page.module.css";

interface PageProps extends PropsWithChildrenOnly {
  ref?: Ref<HTMLDivElement> | undefined;
}

export const Page = ({ children, ref }: PageProps) => {
  return (
    <div ref={ref} className={styles.pageContainer}>
      <div className={styles.pageContent}>{children}</div>
    </div>
  );
};

Page.displayName = "Page";
