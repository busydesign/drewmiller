import { mkdir } from "fs/promises";
import path from "path";

/**
 * Persistent upload root.
 * - Local: public/uploads (served by Next static files)
 * - Railway: set UPLOAD_DIR=/data/uploads and mount a volume there
 */
export function getUploadRoot(): string {
  const fromEnv = process.env.UPLOAD_DIR?.trim();
  if (fromEnv) return path.resolve(fromEnv);
  return path.join(process.cwd(), "public", "uploads");
}

export function getBlogUploadDir(): string {
  return path.join(getUploadRoot(), "blog");
}

export async function ensureBlogUploadDir(): Promise<string> {
  const dir = getBlogUploadDir();
  await mkdir(dir, { recursive: true });
  return dir;
}

export function blogUploadPublicUrl(filename: string): string {
  return `/uploads/blog/${filename}`;
}

const SAFE_FILENAME = /^[a-z0-9][a-z0-9._-]{0,120}$/i;

export function isSafeUploadFilename(filename: string): boolean {
  return SAFE_FILENAME.test(filename) && !filename.includes("..");
}
