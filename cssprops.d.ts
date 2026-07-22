declare module "*.svg" {
  import type { FC, SVGProps } from "react";

  const ReactComponent: FC<SVGProps<SVGSVGElement>>;
  export default ReactComponent;
}

// CSS module keys are typed loosely so classNames object notation works without casts
// (`{ [styles.active]: isActive }`) under noUncheckedIndexedAccess.
declare module "*.module.css" {
  const classes: any;
  export default classes;
}

declare module "*.module.scss" {
  const classes: any;
  export default classes;
}

declare module "*.module.sass" {
  const classes: any;
  export default classes;
}
