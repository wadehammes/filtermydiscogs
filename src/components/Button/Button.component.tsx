import type { ComponentProps, ReactNode, Ref } from "react";
import { Spinner } from "src/components/Spinner/Spinner.component";
import styles from "./Button.module.css";

interface ButtonProps extends Omit<ComponentProps<"button">, "ref"> {
  ref?: Ref<HTMLButtonElement> | undefined;
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "ghost"
    | "success"
    | "outlinePrimary";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string | undefined;
  onPress?: () => void;
  onClick?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
}

const Button = ({
  ref,
  variant = "secondary",
  size = "md",
  children,
  className,
  onPress,
  onClick,
  disabled,
  isLoading = false,
  loadingText,
  ...props
}: ButtonProps) => {
  const handleClick = onPress || onClick;

  const buttonClasses = [
    styles.button,
    styles[variant],
    styles[size],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      ref={ref}
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClasses}
      data-testid="fmdButton"
    >
      {isLoading && (
        <Spinner
          size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"}
          aria-label={loadingText || "Loading"}
        />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
};

Button.displayName = "Button";

export default Button;
