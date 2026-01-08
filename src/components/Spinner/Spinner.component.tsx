import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  "aria-label"?: string;
}

export const Spinner = ({
  size = "md",
  className,
  "aria-label": ariaLabel = "Loading",
  ...props
}: SpinnerProps) => {
  const spinnerClasses = [styles.spinner, styles[size], className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={spinnerClasses}
      role="progressbar"
      aria-busy="true"
      aria-label={ariaLabel}
      {...props}
    />
  );
};

export default Spinner;
