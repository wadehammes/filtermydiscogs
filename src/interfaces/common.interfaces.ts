export enum Environments {
  Local = "local",
  Staging = "staging",
  Production = "production",
}

export enum FontWeight {
  Regular = 400,
  Bold = 700,
}

export enum Alignment {
  Left = "Left",
  Center = "Center",
  Right = "Right",
}

export enum LinkTarget {
  Blank = "_blank",
  Self = "_self",
}

export interface AnimatedWrapperProps {
  wait?: number;
  animate?: boolean;
  index?: number;
}

export enum ContentStyleTypes {
  None = "None",
  Card = "Card",
  Outlined = "Outlined",
}
