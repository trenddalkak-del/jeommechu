import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_PLACES_API_KEY!;
const PLACES_BASE = "https://places.googleapis.com/v1";

export async function GET(
  request: NextRequest,
  { params }: { params: { slug?: string[] } }
) {
  const slug = params.slug || [];
  const photoName = slug.join("/");

  if (!photoName) {
    return NextResponse.json({ error: "Missing photo name" }, { status: 400 });
  }

  const { searchParams } = new URL(request.url);
  const maxWidthPx = searchParams.get("maxWidthPx") || "800";

  const googleUrl = `${PLACES_BASE}/${photoName}/media?maxWidthPx=${maxWidthPx}&key=${API_KEY}`;

  try {
    const res = await fetch(googleUrl, { cache: "no-store" });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Google API error ${res.status}` },
        { status: res.status }
      );
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const arrayBuffer = await res.arrayBuffer();

    return new NextResponse(arrayBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=604800",
      },
    });
  } catch (err) {
    console.error("[PhotoProxy] error:", err);
    return NextResponse.json({ error: "Failed to fetch photo" }, { status: 500 });
  }
}
