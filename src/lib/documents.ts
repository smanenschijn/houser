import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { analyzeDocuments } from "@/lib/ai";
import type { DocumentAnalysis } from "@/lib/types";

export async function analyzeDocumentsAndStore(
  houseId: string,
  rawText: string,
): Promise<DocumentAnalysis | null> {
  if (!rawText) return null;

  const result = await analyzeDocuments(rawText);

  await prisma.house.update({
    where: { id: houseId },
    data: { documentAnalysis: result as unknown as Prisma.InputJsonValue },
  });

  return result;
}
