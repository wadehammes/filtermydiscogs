export const compareByDisplayName = (left: string, right: string): number =>
  left.localeCompare(right, undefined, { sensitivity: "base" });

export const sortByDisplayName = <T>(
  items: readonly T[],
  getName: (item: T) => string,
): T[] =>
  [...items].sort((left, right) =>
    compareByDisplayName(getName(left), getName(right)),
  );
