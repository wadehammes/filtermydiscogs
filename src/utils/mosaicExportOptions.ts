import { MOSAIC_CONSTANTS } from "src/constants/mosaic";
import type { MosaicAspectRatioKey } from "src/utils/generateMosaicImage";

export const MOSAIC_IMAGE_FORMATS = [
  { value: "jpeg" as const, label: "JPEG" },
  { value: "png" as const, label: "PNG" },
] as const;

export type MosaicImageFormat = (typeof MOSAIC_IMAGE_FORMATS)[number]["value"];

export const listMosaicImageFormats = () => [...MOSAIC_IMAGE_FORMATS];

export const listMosaicAspectRatioEntries = (): Array<
  [MosaicAspectRatioKey, { name: string }]
> =>
  Object.entries(MOSAIC_CONSTANTS.ASPECT_RATIOS) as Array<
    [MosaicAspectRatioKey, { name: string }]
  >;
