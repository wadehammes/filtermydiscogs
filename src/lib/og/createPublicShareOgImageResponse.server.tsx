import { ImageResponse } from "next/og";
import { loadDmSansOgFonts } from "src/lib/og/loadDmSansOgFonts.server";
import {
  PublicShareOgImage,
  type PublicShareOgImageProps,
} from "src/lib/og/publicShareOgImage";

export const createPublicShareOgImageResponse = async (
  props: PublicShareOgImageProps,
) =>
  new ImageResponse(<PublicShareOgImage {...props} />, {
    fonts: await loadDmSansOgFonts(),
    height: 630,
    width: 1200,
  });
