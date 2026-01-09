export const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "4px",
  color: "var(--popover-foreground)",
  padding: "8px 12px",
} as const;

export const AXIS_STYLE = { fontSize: "12px" } as const;

export const CHART_MARGIN = { top: 5, right: 30, bottom: 5, left: 5 } as const;

export const LABEL_CONFIG = {
  position: "right" as const,
  fill: "var(--foreground)",
  fontSize: 12,
  fontWeight: 600,
  formatter: (value: unknown) => {
    if (typeof value === "number") {
      return value.toString();
    }
    return String(value ?? "");
  },
};
