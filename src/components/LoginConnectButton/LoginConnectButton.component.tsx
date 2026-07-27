import classNames from "classnames";
import Button from "src/components/Button/Button.component";
import accessibilityStyles from "src/styles/accessibility.module.css";
import DiscogsLogo from "src/styles/icons/discogs-logo.svg";
import styles from "./LoginConnectButton.module.css";

type LoginConnectButtonProps = {
  className?: string | undefined;
  disabled?: boolean;
  isLoading?: boolean;
  onClick: () => void;
  reconnectUsername?: string | null;
};

export const LoginConnectButton = ({
  className,
  disabled = false,
  isLoading = false,
  onClick,
  reconnectUsername = null,
}: LoginConnectButtonProps) => {
  const accessibleName = reconnectUsername
    ? `Connect with ${reconnectUsername}`
    : "Connect with Discogs";

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={onClick}
      disabled={disabled}
      isLoading={isLoading}
      loadingText="Connecting..."
      className={classNames(styles.button, className)}
      aria-label={accessibleName}
    >
      <span className={styles.label} aria-hidden={Boolean(reconnectUsername)}>
        {reconnectUsername ? (
          <>
            Connect with{" "}
            <span className={styles.username}>{reconnectUsername}</span>
          </>
        ) : (
          <>
            Connect with
            <DiscogsLogo className={styles.logo} aria-hidden />
            <span className={accessibilityStyles.visuallyHidden}>Discogs</span>
          </>
        )}
      </span>
    </Button>
  );
};
