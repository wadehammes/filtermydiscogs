import classNames from "classnames";
import type { ReactNode } from "react";
import emptyStateStyles from "src/styles/modules/empty-state.module.css";

export type EmptyStateVariant = "page" | "panel" | "inline";

export interface EmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  variant?: EmptyStateVariant;
  className?: string | undefined;
  testId?: string;
}

const VARIANT_CLASS: Record<EmptyStateVariant, string> = {
  page: emptyStateStyles.page,
  panel: emptyStateStyles.panel,
  inline: emptyStateStyles.inline,
};

export const EmptyState = ({
  title,
  description,
  children,
  variant = "panel",
  className,
  testId = "fmdEmptyState",
}: EmptyStateProps) => (
  <div
    className={classNames(VARIANT_CLASS[variant], className)}
    data-testid={testId}
  >
    <p
      className={
        variant === "page" ? emptyStateStyles.titlePage : emptyStateStyles.title
      }
    >
      {title}
    </p>
    {description ? (
      <p
        className={
          variant === "page"
            ? emptyStateStyles.descriptionPage
            : emptyStateStyles.description
        }
      >
        {description}
      </p>
    ) : null}
    {children}
  </div>
);
