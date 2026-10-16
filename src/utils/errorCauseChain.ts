export const someErrorInCauseChain = (
  error: unknown,
  predicate: (err: Error) => boolean,
): boolean => {
  let current: unknown = error;

  while (current instanceof Error) {
    if (predicate(current)) {
      return true;
    }

    current = current.cause;
  }

  return false;
};
