import { readFile, stat } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getBlogUploadDir, isSafeUploadFilename } from "@/lib/uploads";

export const runtime = "nodejs";

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

type Params = { params: Promise<{ filename: string }> };

/** Serve blog uploads from UPLOAD_DIR (or public/uploads) so Railway volumes work. */
export async function GET(_req: Request, { params }: Params) {
  const { filename } = await params;
  if (!filename || !isSafeUploadFilename(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const filePath = path.join(getBlogUploadDir(), filename);
  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const ext = path.extname(filename).toLowerCase();
    const contentType = CONTENT_TYPES[ext] || "application/octet-stream";
    const data = await readFile(filePath);

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
