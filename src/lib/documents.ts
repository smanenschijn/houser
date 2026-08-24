import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { analyzeDocuments, analyzeDocumentSection } from "@/lib/ai";
import type { DocumentAnalysis, DocumentSectionType } from "@/lib/types";

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

export async function analyzeUploadedDocumentAndStore(
  houseId: string,
  type: DocumentSectionType,
  text: string,
): Promise<DocumentAnalysis> {
  const section = await analyzeDocumentSection(type, text);

  const house = await prisma.house.findUnique({ where: { id: houseId } });
  const current = house?.documentAnalysis as Partial<DocumentAnalysis> | null;

  const merged: DocumentAnalysis = {
    energyLabel: current?.energyLabel ?? { label: null, summary: null },
    questionnaire: current?.questionnaire ?? { present: false, summary: null },
    itemsList: current?.itemsList ?? { present: false, summary: null },
    summary: current?.summary ?? "",
    riskFactors: current?.riskFactors ?? [],
    [type]: section,
  };

  await prisma.house.update({
    where: { id: houseId },
    data: { documentAnalysis: merged as unknown as Prisma.InputJsonValue },
  });

  return merged;
}
