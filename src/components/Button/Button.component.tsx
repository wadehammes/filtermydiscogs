import type { ReactNode } from "react";
import { forwardRef } from "react";
import Spinner from "src/components/Spinner/Spinner.component";
import styles from "./Button.module.css";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost" | "success";
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

const ButtonComponent = ({
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
      onClick={handleClick}
      disabled={isDisabled}
      className={buttonClasses}
    >
      {isLoading && (
        <Spinner size={size === "sm" ? "sm" : size === "lg" ? "lg" : "md"} />
      )}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, _ref) => <ButtonComponent {...props} />,
);

Button.displayName = "Button";

export default Button;
