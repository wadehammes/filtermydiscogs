export type Rgb = readonly [red: number, green: number, blue: number];

const channel = (value: number) => {
  const normalized =
    value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  return normalized;
};

export const relativeLuminance = ([red, green, blue]: Rgb): number =>
  0.2126 * channel(red / 255) +
  0.7152 * channel(green / 255) +
  0.0722 * channel(blue / 255);

export const contrastRatio = (foreground: Rgb, background: Rgb): number => {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
};

const parseHex = (hex: string): Rgb | null => {
  const normalized = hex.replace(/^#/, "").trim();
  if (normalized.length === 3) {
    const [r, g, b] = normalized;
    return [
      Number.parseInt(`${r}${r}`, 16),
      Number.parseInt(`${g}${g}`, 16),
      Number.parseInt(`${b}${b}`, 16),
    ];
  }
  if (normalized.length === 6) {
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ];
  }
  return null;
};

const toByte = (channel: number) =>
  Math.round(Math.min(1, Math.max(0, channel)) * 255);

const parseRgbFunction = (value: string): Rgb | null => {
  const match = value.match(
    /^rgba?\(\s*([\d.]+)(?:[,\s/]+([\d.]+))?(?:[,\s/]+([\d.]+))?/,
  );
  if (!match?.[1]) {
    return null;
  }
  const red = Number(match[1]);
  const green = Number(match[2] ?? match[1]);
  const blue = Number(match[3] ?? match[1]);
  if ([red, green, blue].some((channelValue) => Number.isNaN(channelValue))) {
    return null;
  }
  return [red, green, blue];
};

const parseSrgbFunction = (value: string): Rgb | null => {
  const match = value.match(
    /^color\s*\(\s*srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)/,
  );
  if (!match?.[1]) {
    return null;
  }
  const red = Number(match[1]);
  const green = Number(match[2]);
  const blue = Number(match[3]);
  if ([red, green, blue].some((channelValue) => Number.isNaN(channelValue))) {
    return null;
  }
  return [toByte(red), toByte(green), toByte(blue)];
};

export const parseCssColorToRgb = (value: string): Rgb | null => {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.startsWith("#")) {
    return parseHex(trimmed);
  }
  if (trimmed.startsWith("rgb")) {
    return parseRgbFunction(trimmed);
  }
  if (trimmed.startsWith("color(")) {
    return parseSrgbFunction(trimmed);
  }
  return null;
};

export const WCAG_AA_NORMAL_TEXT = 4.5;

export const meetsContrast = (
  ratio: number,
  minimum: number = WCAG_AA_NORMAL_TEXT,
): boolean => ratio >= minimum;
