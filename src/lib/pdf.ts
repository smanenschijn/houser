import { extractText, extractImages, getDocumentProxy } from "unpdf";
import sharp from "sharp";
import path from "path";
import fs from "fs/promises";

const MAX_SCAN_PAGES = 12;
const MAX_IMAGES = 16;
const MIN_IMAGE_AREA = 150 * 150;
const MAX_IMAGE_WIDTH = 1400;
const MAX_WHITE_RATIO = 0.6;
const MAX_TRANSPARENT_RATIO = 0.2;
const MIN_COLORFULNESS = 25;
const MIN_LUMINANCE_STDEV = 15;

export interface ParsedPdf {
  text: string;
  imagePath: string | null;
  images: string[];
}

export type ProgressFn = (percent: number, label: string) => void;

export async function parsePdfText(buffer: Buffer): Promise<string> {
  const data = new Uint8Array(buffer);
  const doc = await getDocumentProxy(data);
  try {
    const { text } = await extractText(doc, { mergePages: true });
    return text;
  } finally {
    await doc.loadingTask.destroy();
  }
}

export async function parsePdf(
  buffer: Buffer,
  houseId: string,
  uploadDir: string,
  onProgress?: ProgressFn,
): Promise<ParsedPdf> {
  const data = new Uint8Array(buffer);
  const doc = await getDocumentProxy(data);

  try {
    onProgress?.(5, "Tekst extraheren…");
    const { text } = await extractText(doc, { mergePages: true });
    onProgress?.(15, "Afbeeldingen zoeken…");
    const images = await extractHouseImages(doc, houseId, uploadDir, onProgress);
    return { text, imagePath: images[0] ?? null, images };
  } finally {
    await doc.loadingTask.destroy();
  }
}

interface CandidateImage {
  data: Uint8ClampedArray;
  width: number;
  height: number;
  channels: 1 | 3 | 4;
}

function isHousePhoto(img: CandidateImage): boolean {
  const { data, width, height, channels } = img;
  const total = width * height;
  const stride = Math.max(1, Math.floor(total / 20000));

  let white = 0;
  let transparent = 0;
  let colorfulness = 0;
  let lumaSum = 0;
  let lumaSumSq = 0;
  let sampled = 0;

  for (let i = 0; i < total; i += stride) {
    const offset = i * channels;
    const r = data[offset];
    const g = channels >= 3 ? data[offset + 1] : r;
    const b = channels >= 3 ? data[offset + 2] : r;
    const a = channels === 4 ? data[offset + 3] : 255;

    if (a < 250) transparent++;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (min >= 235) white++;
    colorfulness += max - min + Math.abs(r - g) + Math.abs(g - b);

    const luma = 0.299 * r + 0.587 * g + 0.114 * b;
    lumaSum += luma;
    lumaSumSq += luma * luma;
    sampled++;
  }

  if (sampled === 0) return false;

  const whiteRatio = white / sampled;
  const transparentRatio = transparent / sampled;
  const avgColorfulness = colorfulness / sampled;
  const mean = lumaSum / sampled;
  const lumaStdev = Math.sqrt(Math.max(0, lumaSumSq / sampled - mean * mean));

  if (transparentRatio > MAX_TRANSPARENT_RATIO) return false;
  if (whiteRatio >= MAX_WHITE_RATIO) return false;
  if (whiteRatio >= 0.4 && avgColorfulness < MIN_COLORFULNESS) return false;
  if (lumaStdev < MIN_LUMINANCE_STDEV) return false;

  return true;
}

async function extractHouseImages(
  doc: Awaited<ReturnType<typeof getDocumentProxy>>,
  houseId: string,
  uploadDir: string,
  onProgress?: ProgressFn,
): Promise<string[]> {
  const pages = Math.min(doc.numPages, MAX_SCAN_PAGES);
  const candidates: CandidateImage[] = [];

  for (let page = 1; page <= pages; page++) {
    onProgress?.(
      15 + Math.round((page / pages) * 40),
      `Afbeeldingen zoeken… (pagina ${page}/${pages})`,
    );
    const images = await extractImages(doc, page);
    for (const img of images) {
      const candidate = img as CandidateImage;
      if (candidate.width * candidate.height < MIN_IMAGE_AREA) continue;
      if (!isHousePhoto(candidate)) continue;
      candidates.push(candidate);
    }
  }

  candidates.sort((a, b) => b.width * b.height - a.width * a.height);
  const top = candidates.slice(0, MAX_IMAGES);

  if (top.length === 0) return [];

  await fs.mkdir(uploadDir, { recursive: true });
  const paths: string[] = [];

  for (let i = 0; i < top.length; i++) {
    onProgress?.(
      55 + Math.round(((i + 1) / top.length) * 10),
      "Afbeeldingen opslaan…",
    );
    const img = top[i];
    const filename = i === 0 ? `${houseId}.jpg` : `${houseId}-${i}.jpg`;
    const filePath = path.join(uploadDir, filename);

    await sharp(Buffer.from(img.data), {
      raw: { width: img.width, height: img.height, channels: img.channels },
    })
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(filePath);

    paths.push(`/uploads/${filename}`);
  }

  return paths;
}
