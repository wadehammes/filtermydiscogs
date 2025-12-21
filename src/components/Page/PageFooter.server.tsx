import Heart from "src/styles/icons/heart-solid.svg";
import styles from "./Page.module.css";

/**
 * Server Component for the page footer.
 * This reduces client bundle size by rendering the footer on the server.
 */
export function PageFooter() {
  const currentYear = new Date().getFullYear();

  return (
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
      <span>&copy; {currentYear}</span>
    </div>
  );
}
