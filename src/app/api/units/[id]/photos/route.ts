import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { connectDB } from "@/lib/db";
import { Unit } from "@/models/Unit";
import { uploadImage } from "@/lib/gridfs";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  await connectDB();
  const unit = await Unit.findOne({ _id: id, ownerId: session.user.id });
  if (!unit) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const { fileId, thumbId } = await uploadImage(buffer, file.name, file.type, {
      unitId: id,
      ownerId: session.user.id,
    });

    const isCover = unit.photos.length === 0;
    unit.photos.push({
      fileId,
      thumbId,
      order: unit.photos.length,
      isCover,
    });
    await unit.save();

    return NextResponse.json({
      ok: true,
      photo: {
        fileId: fileId.toString(),
        thumbId: thumbId.toString(),
        order: unit.photos.length - 1,
        isCover,
      },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "upload_failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
