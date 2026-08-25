import { prisma } from "@/lib/db";
import { parsePdf } from "@/lib/pdf";
import { extractHouseFromText } from "@/lib/ai";
import { analyzeDocumentsAndStore } from "@/lib/documents";
import { scoreHouseAndStore } from "@/lib/score";
import { getUploadDir } from "@/lib/uploads";

export async function processHouse(houseId: string, buffer: Buffer) {
  const onProgress = (percent: number, label: string) => {
    prisma.house
      .update({
        where: { id: houseId },
        data: { progress: percent, progressLabel: label },
      })
      .catch(() => {});
  };

  try {
    const { text, imagePath, images } = await parsePdf(
      buffer,
      houseId,
      getUploadDir(),
      onProgress,
    );
    await prisma.house.update({
      where: { id: houseId },
      data: { progress: 70, progressLabel: "Gegevens analyseren met AI…" },
    });
    const extracted = await extractHouseFromText(text);

    await prisma.house.update({
      where: { id: houseId },
      data: {
        rawText: text,
        imagePath,
        images,
        title: extracted.title,
        description: extracted.description,
        energyLabel: extracted.energyLabel,
        livingArea: extracted.livingArea,
        plotSize: extracted.plotSize,
        price: extracted.price,
        address: extracted.address,
        status: "scoring",
        error: null,
        progress: 100,
        progressLabel: null,
      },
    });

    try {
      await scoreHouseAndStore(houseId);
      await prisma.house.update({
        where: { id: houseId },
        data: { status: "ready", error: null },
      });
    } catch (err) {
      console.error(`[processHouse] auto-score ${houseId}: ${err}`);
      await prisma.house
        .update({ where: { id: houseId }, data: { status: "ready", error: null } })
        .catch(() => {});
    }

    try {
      await analyzeDocumentsAndStore(houseId, text);
    } catch (err) {
      console.error(`[processHouse] document analysis ${houseId}: ${err}`);
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "PDF verwerken mislukt";
    console.error(`[processHouse] ${houseId}: ${message}`);
    await prisma.house
      .update({
        where: { id: houseId },
        data: { status: "error", error: message, progressLabel: null },
      })
      .catch(() => {});
  }
}
