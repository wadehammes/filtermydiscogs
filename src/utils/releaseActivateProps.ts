import type { KeyboardEvent } from "react";

interface GetReleaseActivatePropsParams {
  onActivate: () => void;
  ariaLabel: string;
}

export const getReleaseActivateProps = ({
  onActivate,
  ariaLabel,
}: GetReleaseActivatePropsParams) => {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onActivate();
    }
  };

  const handleClick = () => {
    onActivate();
  };

  return {
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    role: "button" as const,
    tabIndex: 0,
    "aria-label": ariaLabel,
  };
};
