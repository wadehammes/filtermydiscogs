import styles from "./Spinner.module.css";

export interface SpinnerProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl";
  className?: string | undefined;
  "aria-label": string;
}

export const Spinner = ({
  size = "md",
  className,
  "aria-label": ariaLabel = "Loading",
  ...props
}: SpinnerProps) => {
  const sizeClass =
    size === "2xl"
      ? styles.twoXl
      : size === "3xl"
        ? styles.threeXl
        : styles[size];
  const spinnerClasses = [styles.spinner, sizeClass, className]
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
