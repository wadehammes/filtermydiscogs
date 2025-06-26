import type { ReactNode } from "react";
import { forwardRef } from "react";
import styles from "./Button.module.css";

export interface ButtonProps {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  className?: string;
  onPress?: () => void;
  onClick?: () => void;
  disabled?: boolean;
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

  return (
    <button
      {...props}
      onClick={handleClick}
      disabled={disabled}
      className={buttonClasses}
    >
      {children}
    </button>
  );
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (props, _ref) => <ButtonComponent {...props} />,
);

Button.displayName = "Button";

export default Button;
