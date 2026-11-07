import { NextRequest, NextResponse } from "next/server";
import { getFileStream } from "@/lib/gridfs";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const size = req.nextUrl.searchParams.get("size") === "thumb" ? "thumb" : "full";

  try {
    const file = await getFileStream(id, size);
    if (!file) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const chunks: Buffer[] = [];
    for await (const chunk of file.stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": file.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
