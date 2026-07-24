import { randomBytes } from "crypto";
import { writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { getAdminSession } from "@/lib/auth";
import {
  blogUploadPublicUrl,
  ensureBlogUploadDir,
} from "@/lib/uploads";

export const runtime = "nodejs";

const MAX_BYTES = 8 * 1024 * 1024; // 8MB
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/gif", "gif"],
]);

function sanitizeBaseName(name: string): string {
  return name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export async function POST(req: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const form = await req.formData().catch(() => null);
    if (!form) {
      return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
    }

    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    if (file.size <= 0 || file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "Image must be under 8MB" },
        { status: 400 }
      );
    }

    const ext = ALLOWED.get(file.type);
    if (!ext) {
      return NextResponse.json(
        { error: "Use a JPG, PNG, WebP, or GIF image" },
        { status: 400 }
      );
    }

    const base = sanitizeBaseName(file.name) || "image";
    const filename = `${base}-${randomBytes(4).toString("hex")}.${ext}`;
    const uploadsDir = await ensureBlogUploadDir();
    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadsDir, filename), buffer);

    const url = blogUploadPublicUrl(filename);
    return NextResponse.json({
      ok: true,
      url,
      filename,
      persistent: Boolean(process.env.UPLOAD_DIR?.trim()),
    });
  } catch (err) {
    console.error("[upload]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? err.message
            : "Upload failed — check disk/volume permissions",
      },
      { status: 500 }
    );
  }
}
