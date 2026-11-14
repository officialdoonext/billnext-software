import { NextRequest, NextResponse } from "next/server";
import ImageKit from "imagekit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, fileName } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "No image payload provided" }, { status: 400 });
    }

    const cleanKey = (val?: string) => (val ? val.replace(/^["']|["']$/g, "").trim() : "");

    const publicKey = cleanKey(
      process.env.IMAGEKIT_PUBLIC_KEY || process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    );
    const privateKey = cleanKey(process.env.IMAGEKIT_PRIVATE_KEY);
    const urlEndpoint = cleanKey(
      process.env.IMAGEKIT_URL_ENDPOINT || process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
    );

    // Strict ImageKit check: Must be configured
    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json(
        {
          error:
            "ImageKit configuration is missing in .env.local. Please ensure IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT are set.",
        },
        { status: 500 }
      );
    }

    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });

    const cleanBase64 = imageBase64.includes(",")
      ? imageBase64.split(",")[1]
      : imageBase64;

    const uploadResponse = await imagekit.upload({
      file: cleanBase64,
      fileName: fileName || `item_${Date.now()}.webp`,
      folder: "/billnext_items",
    });

    if (!uploadResponse?.url) {
      throw new Error("ImageKit did not return a valid URL");
    }

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      source: "imagekit",
    });
  } catch (error: any) {
    console.error("ImageKit upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image to ImageKit" },
      { status: 500 }
    );
  }
}
