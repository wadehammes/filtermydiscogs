import type { SVGProps } from "react";

export const DiceThinIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <rect x="2.5" y="2.5" width="11" height="11" rx="1.5" />
    <circle cx="5.5" cy="5.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="5.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="8" cy="8" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="5.5" cy="10.5" r="0.75" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="10.5" r="0.75" fill="currentColor" stroke="none" />
  </svg>
);
