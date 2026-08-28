export type TickerSegment =
  | {
      kind: "digit";
      digitValue: number;
      startDigit: number;
      digitIndex: number;
    }
  | { kind: "static"; char: string };

const countFormatter = new Intl.NumberFormat("en-US");

export const formatLocaleCount = (value: number): string =>
  countFormatter.format(value);

export const tickerStartValue = (total: number): number => {
  if (total <= 1) {
    return total;
  }

  const step = total >= 1000 ? 100 : total >= 100 ? 10 : total >= 20 ? 5 : 1;

  const roundedStart = Math.floor((total * 0.78) / step) * step;

  return Math.max(1, Math.min(total - 1, roundedStart));
};

export const buildLocaleTickerSegments = (
  target: number,
  start: number,
): TickerSegment[] => {
  const targetFormatted = countFormatter.format(target);
  const targetDigits = target.toString().split("");
  const startDigits = start
    .toString()
    .padStart(targetDigits.length, "0")
    .split("");

  const segments: TickerSegment[] = [];
  let digitIndex = 0;

  for (const character of targetFormatted) {
    if (character >= "0" && character <= "9") {
      segments.push({
        kind: "digit",
        digitValue: Number.parseInt(character, 10),
        startDigit: Number.parseInt(startDigits[digitIndex] ?? "0", 10),
        digitIndex,
      });
      digitIndex += 1;
      continue;
    }

    segments.push({ kind: "static", char: character });
  }

  return segments;
};
