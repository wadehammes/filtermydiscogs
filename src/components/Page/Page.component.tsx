import { forwardRef, type Ref } from "react";
import type { PropsWithChildrenOnly } from "src/@types/react";
import { Helmet } from "src/components/Page/Helmet.component";
import Heart from "src/styles/icons/heart-solid.svg";
import styles from "./Page.module.css";

export const Page = forwardRef(
  ({ children }: PropsWithChildrenOnly, _ref: Ref<HTMLDivElement>) => {
    return (
      <div className={styles.pageContainer}>
        <Helmet />
        <div className={styles.pageContent}>{children}</div>
        <div className={styles.footer}>
          <Heart />{" "}
          <span>
            made with love by{" "}
            <a href="https://wadehammes.com" target="_blank" rel="noreferrer">
              Wade Hammes
            </a>
          </span>
          <span>
            <a
              href="https://github.com/wadehammes/filtermydiscogs"
              target="_blank"
              rel="noreferrer"
            >
              Contribute to the project
            </a>
          </span>
          <span>&copy; {new Date().getFullYear()}</span>
        </div>
      </div>
    );
  },
);

export default Page;
Page.displayName = "Page";
