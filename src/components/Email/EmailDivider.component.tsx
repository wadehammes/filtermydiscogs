import type { CSSProperties } from "react";
import { Hr } from "react-email";
import { emailClasses } from "src/components/Email/emailClasses";
import { emailBrand } from "src/components/Email/emailTheme";

const dividerStyle: CSSProperties = {
  appearance: "none",
  border: "none",
  borderTop: `1px dashed ${emailBrand.divider}`,
  height: 0,
  width: "100%",
};

export const EmailDivider = () => (
  <Hr className={emailClasses.hr} style={dividerStyle} />
);
