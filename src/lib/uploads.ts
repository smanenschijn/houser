import path from "path";
import fs from "fs/promises";

export function getUploadDir(): string {
  return path.resolve(
    process.env.UPLOAD_DIR ?? path.join(process.cwd(), "uploads"),
  );
}

export async function deleteUploadedImages(
  refs: (string | null | undefined)[],
): Promise<void> {
  const uploadDir = getUploadDir();
  const files = new Set<string>();

  for (const ref of refs) {
    if (!ref) continue;
    const name = path.basename(ref);
    if (!name) continue;
    const filePath = path.join(uploadDir, name);
    if (filePath !== uploadDir && filePath.startsWith(uploadDir + path.sep)) {
      files.add(filePath);
    }
  }

  await Promise.all(
    [...files].map((file) => fs.unlink(file).catch(() => {})),
  );
}
