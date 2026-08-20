import type { SVGProps } from "react";

export const ListPlusThinIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1"
    strokeLinecap="round"
    aria-hidden
    {...props}
  >
    <line x1="2" y1="3.5" x2="7" y2="3.5" />
    <line x1="2" y1="8" x2="7" y2="8" />
    <line x1="2" y1="12.5" x2="7" y2="12.5" />
    <line x1="12" y1="6" x2="12" y2="10" />
    <line x1="10" y1="8" x2="14" y2="8" />
  </svg>
);
