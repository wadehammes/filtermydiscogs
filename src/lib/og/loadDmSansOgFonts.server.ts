import { readFile } from "node:fs/promises";
import { PUBLIC_SHARE_OG_FONT_FAMILY } from "src/lib/og/publicShareOgImage";

const asArrayBuffer = (bytes: Buffer): ArrayBuffer =>
  bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer;

export const loadDmSansOgFonts = async () => {
  const [regular, bold] = await Promise.all([
    readFile(new URL("./fonts/DMSans-Regular.ttf", import.meta.url)),
    readFile(new URL("./fonts/DMSans-Bold.ttf", import.meta.url)),
  ]);

  return [
    {
      data: asArrayBuffer(regular),
      name: PUBLIC_SHARE_OG_FONT_FAMILY,
      style: "normal" as const,
      weight: 400 as const,
    },
    {
      data: asArrayBuffer(bold),
      name: PUBLIC_SHARE_OG_FONT_FAMILY,
      style: "normal" as const,
      weight: 700 as const,
    },
  ];
};
