const CSS_MODULE_CLASS_PATTERN = /^\.([a-zA-Z_][\w-]*)\s*\{/gm;

export const listCssModuleClassNames = (cssSource: string): string[] => {
  const classNames: string[] = [];

  for (const match of cssSource.matchAll(CSS_MODULE_CLASS_PATTERN)) {
    const className = match[1];

    if (className) {
      classNames.push(className);
    }
  }

  return classNames;
};

export const findUnusedCssModuleClasses = (
  cssSource: string,
  tsxSource: string,
): string[] =>
  listCssModuleClassNames(cssSource).filter(
    (className) => !tsxSource.includes(`styles.${className}`),
  );
