const CSS_MODULE_CLASS_PATTERN = /^\.([a-zA-Z_][\w-]*)\s*\{/gm;

export const listCssModuleClassNames = (cssSource: string): string[] =>
  [...cssSource.matchAll(CSS_MODULE_CLASS_PATTERN)].flatMap((match) =>
    match[1] ? [match[1]] : [],
  );

export const findUnusedCssModuleClasses = (
  cssSource: string,
  tsxSource: string,
): string[] =>
  listCssModuleClassNames(cssSource).filter(
    (className) => !tsxSource.includes(`styles.${className}`),
  );
