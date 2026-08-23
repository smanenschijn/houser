import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { getUploadDir } from "@/lib/uploads";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await ctx.params;
  const uploadDir = getUploadDir();
  const filePath = path.join(uploadDir, ...segments);

  if (!filePath.startsWith(uploadDir)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const data = fs.readFileSync(filePath);
    const ext = path.extname(filePath).toLowerCase();
    const type = ext === ".png" ? "image/png" : "image/jpeg";
    return new NextResponse(data, {
      headers: {
        "Content-Type": type,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
