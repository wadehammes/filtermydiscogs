import React from "react";

const SvgComponent = React.forwardRef((props, ref) =>
  React.createElement("svg", { ref, ...props, "data-testid": "svg-mock" }),
);

export default SvgComponent;
export const ReactComponent = SvgComponent;
