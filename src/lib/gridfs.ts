import mongoose from "mongoose";
import { GridFSBucket, ObjectId } from "mongodb";
import sharp from "sharp";
import { connectDB } from "@/lib/db";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_BYTES = 10 * 1024 * 1024;

export async function getBucket() {
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB not connected");
  return new GridFSBucket(db, { bucketName: "unitPhotos" });
}

export async function uploadImage(
  buffer: Buffer,
  filename: string,
  mimeType: string,
  metadata: Record<string, unknown> = {}
) {
  if (!ALLOWED_TYPES.includes(mimeType)) {
    throw new Error("INVALID_MIME");
  }
  if (buffer.length > MAX_BYTES) {
    throw new Error("FILE_TOO_LARGE");
  }

  const full = await sharp(buffer)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();

  const thumb = await sharp(buffer)
    .rotate()
    .resize({ width: 400, height: 400, fit: "cover" })
    .webp({ quality: 75 })
    .toBuffer();

  const bucket = await getBucket();

  const fullId = await writeBuffer(bucket, full, filename.replace(/\.\w+$/, "") + ".webp", {
    ...metadata,
    contentType: "image/webp",
    kind: "full",
  });

  const thumbId = await writeBuffer(
    bucket,
    thumb,
    filename.replace(/\.\w+$/, "") + "-thumb.webp",
    {
      ...metadata,
      contentType: "image/webp",
      kind: "thumb",
      parentId: fullId.toString(),
    }
  );

  return { fileId: fullId, thumbId };
}

function writeBuffer(
  bucket: GridFSBucket,
  buffer: Buffer,
  filename: string,
  metadata: Record<string, unknown>
): Promise<ObjectId> {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      contentType: String(metadata.contentType || "image/webp"),
      metadata,
    });
    uploadStream.on("error", reject);
    uploadStream.on("finish", () => resolve(uploadStream.id as ObjectId));
    uploadStream.end(buffer);
  });
}

export async function deleteImage(fileId: string | ObjectId) {
  const bucket = await getBucket();
  const id = typeof fileId === "string" ? new ObjectId(fileId) : fileId;
  try {
    await bucket.delete(id);
  } catch {
    // already gone
  }

  const files = bucket.find({ "metadata.parentId": id.toString() });
  for await (const file of files) {
    try {
      await bucket.delete(file._id);
    } catch {
      // ignore
    }
  }
}

export async function getFileStream(fileId: string, size?: "thumb" | "full") {
  const bucket = await getBucket();
  const id = new ObjectId(fileId);

  if (size === "thumb") {
    const thumbs = await bucket.find({ "metadata.parentId": fileId }).toArray();
    if (thumbs[0]) {
      return {
        stream: bucket.openDownloadStream(thumbs[0]._id),
        contentType: thumbs[0].contentType || "image/webp",
      };
    }
  }

  const files = await bucket.find({ _id: id }).toArray();
  if (!files[0]) return null;

  return {
    stream: bucket.openDownloadStream(id),
    contentType: files[0].contentType || "image/webp",
  };
}
