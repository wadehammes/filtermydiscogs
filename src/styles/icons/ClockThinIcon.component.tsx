import type { SVGProps } from "react";

export const ClockThinIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <path d="M8 4.5V8l2.5 2" />
  </svg>
);