import { type NextRequest, NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  try {
    if (
      !(
        imageUrl.startsWith("https://i.discogs.com/") ||
        imageUrl.startsWith("https://img.discogs.com/")
      )
    ) {
      return NextResponse.json(
        { error: "Invalid image source" },
        { status: 400 },
      );
    }

    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "FilterMyDiscogs/1.0 (https://filtermydiscogs.com)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image" },
        { status: response.status },
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const originalContentType =
      response.headers.get("content-type") || "image/jpeg";

    const width = searchParams.get("w");
    const height = searchParams.get("h");
    const quality = searchParams.get("q") || "85";
    const format = searchParams.get("f") || "jpeg";

    try {
      let sharpInstance = sharp(Buffer.from(imageBuffer));

      if (width || height) {
        const resizeOptions: {
          width?: number;
          height?: number;
          fit: "cover";
          position: "center";
        } = {
          fit: "cover",
          position: "center",
        };
        if (width) resizeOptions.width = parseInt(width, 10);
        if (height) resizeOptions.height = parseInt(height, 10);

        sharpInstance = sharpInstance.resize(resizeOptions);
      }

      let optimizedBuffer: Buffer;
      let contentType: string;

      if (format === "png") {
        optimizedBuffer = await sharpInstance
          .png({
            quality: parseInt(quality, 10),
            compressionLevel: 9,
            progressive: true,
          })
          .toBuffer();
        contentType = "image/png";
      } else {
        optimizedBuffer = await sharpInstance
          .jpeg({
            quality: parseInt(quality, 10),
            progressive: true,
            mozjpeg: true,
          })
          .toBuffer();
        contentType = "image/jpeg";
      }

      return new NextResponse(optimizedBuffer as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": contentType,
          "Cache-Control":
            "public, max-age=86400, stale-while-revalidate=172800",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    } catch (sharpError) {
      console.error(
        "Sharp optimization failed, returning original image:",
        sharpError,
      );
      return new NextResponse(imageBuffer as BodyInit, {
        status: 200,
        headers: {
          "Content-Type": originalContentType,
          "Cache-Control": "public, max-age=86400",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
