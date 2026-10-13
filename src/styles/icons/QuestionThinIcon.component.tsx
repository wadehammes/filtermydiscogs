import type { SVGProps } from "react";

export const QuestionThinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden
    {...props}
  >
    <circle cx="8" cy="8" r="6.5" />
    <path d="M6.15 6.35a1.85 1.85 0 1 1 3.05 1.4c-.75.45-1.2.95-1.2 1.75" />
    <circle cx="8" cy="11.75" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);
