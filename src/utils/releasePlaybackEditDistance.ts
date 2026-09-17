const MIN_FUZZY_TOKEN_LENGTH = 4;

export const tokensAreWithinEditDistanceOne = (
  left: string,
  right: string,
): boolean => {
  if (left === right) {
    return true;
  }

  if (
    left.length < MIN_FUZZY_TOKEN_LENGTH ||
    right.length < MIN_FUZZY_TOKEN_LENGTH
  ) {
    return false;
  }

  const lengthDelta = Math.abs(left.length - right.length);

  if (lengthDelta > 1) {
    return false;
  }

  if (lengthDelta === 0) {
    let mismatches = 0;

    for (let index = 0; index < left.length; index += 1) {
      if (left[index] !== right[index]) {
        mismatches += 1;

        if (mismatches > 1) {
          return false;
        }
      }
    }

    return mismatches === 1;
  }

  const [shorter, longer] =
    left.length < right.length ? [left, right] : [right, left];
  let shorterIndex = 0;
  let longerIndex = 0;
  let edits = 0;

  while (shorterIndex < shorter.length && longerIndex < longer.length) {
    if (shorter[shorterIndex] === longer[longerIndex]) {
      shorterIndex += 1;
      longerIndex += 1;
      continue;
    }

    edits += 1;

    if (edits > 1) {
      return false;
    }

    longerIndex += 1;
  }

  return true;
};
