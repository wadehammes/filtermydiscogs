export type FactoryOverrides<T> = {
  [K in keyof T]?: T[K] | undefined;
};

export const mergeFactoryAttributes = <T extends object>(
  instance: T,
  attributes?: FactoryOverrides<T>,
): T => {
  if (!attributes) {
    return instance;
  }

  const merged = { ...instance };

  for (const key of Object.keys(attributes) as Array<keyof T>) {
    const value = attributes[key];

    if (value === undefined) {
      delete merged[key];
      continue;
    }

    merged[key] = value as T[keyof T];
  }

  return merged;
};
