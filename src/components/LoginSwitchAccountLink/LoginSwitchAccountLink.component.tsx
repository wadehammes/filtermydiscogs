import classNames from "classnames";
import typography from "src/styles/typography.module.css";
import styles from "./LoginSwitchAccountLink.module.css";

type LoginSwitchAccountLinkProps = {
  disabled?: boolean;
  onClick: () => void;
};

export const LoginSwitchAccountLink = ({
  disabled = false,
  onClick,
}: LoginSwitchAccountLinkProps) => (
  <p
    className={classNames(typography.metaCaption, styles.switchAccount)}
    data-testid="fmdLoginSwitchAccountLink"
  >
    <button
      type="button"
      className={styles.button}
      onClick={onClick}
      disabled={disabled}
    >
      Use a different Discogs account?
    </button>
  </p>
);
