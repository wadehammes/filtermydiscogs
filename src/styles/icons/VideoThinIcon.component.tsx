import type { SVGProps } from "react";

export const VideoThinIcon = (props: SVGProps<SVGSVGElement>) => (
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
    <rect x="1.5" y="4.5" width="7.5" height="7" rx="0.75" />
    <path d="M9 7.5 13.5 5.5v5L9 8.5z" />
  </svg>
);
