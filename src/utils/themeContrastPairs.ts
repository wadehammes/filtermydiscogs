export type ThemeContrastPair = {
  id: string;
  foregroundVar: string;
  backgroundVar: string;
  minimum: number;
};

export const THEME_CONTRAST_PAIRS: ThemeContrastPair[] = [
  {
    id: "body-text",
    foregroundVar: "--foreground",
    backgroundVar: "--background",
    minimum: 4.5,
  },
  {
    id: "muted-text",
    foregroundVar: "--muted-foreground",
    backgroundVar: "--muted",
    minimum: 4.5,
  },
  {
    id: "card-text",
    foregroundVar: "--card-foreground",
    backgroundVar: "--card",
    minimum: 4.5,
  },
  {
    id: "primary-fill",
    foregroundVar: "--primary-foreground",
    backgroundVar: "--primary",
    minimum: 4.5,
  },
  {
    id: "secondary-chrome",
    foregroundVar: "--secondary-foreground",
    backgroundVar: "--secondary",
    minimum: 4.5,
  },
  {
    id: "link-on-page",
    foregroundVar: "--link",
    backgroundVar: "--background",
    minimum: 4.5,
  },
  {
    id: "popover-text",
    foregroundVar: "--popover-foreground",
    backgroundVar: "--popover",
    minimum: 4.5,
  },
];
