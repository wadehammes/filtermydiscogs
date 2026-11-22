import type { TailwindConfig } from "react-email";

export const emailBrand = {
  bg: "#0a0a0c",
  divider: "#27272a",
  muted: "#a1a1aa",
  primary: "#0066ff",
  surface: "#0f0f12",
  text: "#fafafa",
} as const;

export const emailTailwindConfig = {
  theme: {
    extend: {
      colors: {
        fmd: { ...emailBrand },
      },
      fontFamily: {
        sans: [
          "DM Sans",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        meta: [
          "JetBrains Mono",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
} satisfies TailwindConfig;
