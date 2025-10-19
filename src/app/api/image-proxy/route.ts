import { type NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get("url");

  if (!imageUrl) {
    return NextResponse.json({ error: "Missing image URL" }, { status: 400 });
  }

  try {
    // Validate that the URL is from a trusted source (Discogs)
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

    // Fetch the image from Discogs
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
    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Return the image with proper CORS headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400", // Cache for 24 hours
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Error proxying image:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
