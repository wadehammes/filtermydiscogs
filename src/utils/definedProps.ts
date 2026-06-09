type DefinedProps<T extends object> = {
  [K in keyof T as T[K] extends undefined ? never : K]: Exclude<
    T[K],
    undefined
  >;
};

/**
 * Omit keys whose value is `undefined` so object spreads satisfy
 * exactOptionalPropertyTypes (optional props must be omitted, not undefined).
 */
export const definedProps = <T extends object>(input: T): DefinedProps<T> => {
  const result = {} as DefinedProps<T>;

  for (const key of Object.keys(input) as Array<keyof T>) {
    const value = input[key];

    if (value !== undefined) {
      result[key as keyof DefinedProps<T>] =
        value as DefinedProps<T>[keyof DefinedProps<T>];
    }
  }

  return result;
};
