import styles from "./ErrorMessage.module.css";

export interface ErrorMessageProps {
  message: string;
  className?: string;
}

export const ErrorMessage = ({ message, className }: ErrorMessageProps) => {
  const errorClasses = [styles.error, className].filter(Boolean).join(" ");

  return (
    <div className={errorClasses} role="alert">
      <p>{message}</p>
    </div>
  );
};

export default ErrorMessage;
