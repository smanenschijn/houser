import fs from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { scoreHouseAndStore } from "@/lib/score";
import { getUploadDir } from "@/lib/uploads";
import {
  launchFundaBrowser,
  newFundaPage,
  scrapeSearchListingRefs,
  scrapeListingDetail,
  type FundaSearchFilters,
} from "@/lib/funda";

const MAX_PAGES = Number(process.env.FUNDA_MAX_PAGES ?? 3);
const MAX_IMAGES = Number(process.env.FUNDA_MAX_IMAGES ?? 6);
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

interface ProfileLike {
  id: string;
  cities: string[];
  priceMin: number | null;
  priceMax: number | null;
  objectTypes: string[];
  livingAreaMin: number | null;
}

function toFilters(profile: ProfileLike): FundaSearchFilters {
  return {
    cities: profile.cities,
    priceMin: profile.priceMin,
    priceMax: profile.priceMax,
    objectTypes: profile.objectTypes,
    livingAreaMin: profile.livingAreaMin,
  };
}

async function downloadImage(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": USER_AGENT } });
    if (!res.ok) return false;
    const buffer = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buffer);
    return true;
  } catch (err) {
    console.error(`[importFunda] image download failed ${url}:`, err);
    return false;
  }
}

async function storeImages(houseId: string, urls: string[]): Promise<string[]> {
  const uploadDir = getUploadDir();
  await fs.mkdir(uploadDir, { recursive: true });

  const paths: string[] = [];
  const limited = urls.slice(0, MAX_IMAGES);

  for (let i = 0; i < limited.length; i++) {
    const filename = i === 0 ? `${houseId}.jpg` : `${houseId}-${i}.jpg`;
    const destPath = path.join(uploadDir, filename);
    const ok = await downloadImage(limited[i], destPath);
    if (ok) paths.push(`/uploads/${filename}`);
  }

  return paths;
}

async function importProfile(profile: ProfileLike): Promise<number> {
  const browser = await launchFundaBrowser();
  let page;

  try {
    page = await newFundaPage(browser);
    const refs = await scrapeSearchListingRefs(page, toFilters(profile), MAX_PAGES);

    let imported = 0;
    for (const ref of refs) {
      const existing = await prisma.house.findUnique({
        where: { fundaId: ref.fundaId },
        select: { id: true },
      });

      let listing;
      try {
        listing = await scrapeListingDetail(page, ref.url);
      } catch (err) {
        console.error(`[importFunda] detail failed ${ref.url}:`, err);
        continue;
      }

      if (existing) {
        await prisma.house.update({
          where: { id: existing.id },
          data: {
            title: listing.title,
            description: listing.description,
            rawText: listing.description,
            energyLabel: listing.energyLabel,
            livingArea: listing.livingArea,
            plotSize: listing.plotSize,
            price: listing.price,
            address: listing.address,
            listingStatus: listing.listingStatus,
          },
        });
        continue;
      }

      const house = await prisma.house.create({
        data: {
          source: "funda",
          fundaId: listing.fundaId,
          fundaUrl: listing.url,
          searchProfileId: profile.id,
          title: listing.title,
          description: listing.description,
          rawText: listing.description,
          energyLabel: listing.energyLabel,
          livingArea: listing.livingArea,
          plotSize: listing.plotSize,
          price: listing.price,
          address: listing.address,
          listingStatus: listing.listingStatus,
          status: "ready",
        },
      });

      try {
        const images = await storeImages(house.id, listing.imageUrls);
        await prisma.house.update({
          where: { id: house.id },
          data: { images, imagePath: images[0] ?? null },
        });
      } catch (err) {
        console.error(`[importFunda] images failed ${house.id}:`, err);
      }

      try {
        await scoreHouseAndStore(house.id);
      } catch (err) {
        console.error(`[importFunda] auto-score ${house.id}:`, err);
      }

      imported++;
    }

    return imported;
  } finally {
    await browser.close();
  }
}

export async function runSearchProfile(profileId: string): Promise<number> {
  const profile = await prisma.searchProfile.findUnique({ where: { id: profileId } });
  if (!profile) throw new Error("Zoekopdracht niet gevonden");

  await prisma.searchProfile.update({
    where: { id: profileId },
    data: { lastRunAt: new Date(), lastRunStatus: "running", lastRunError: null },
  });

  try {
    const count = await importProfile(profile);
    await prisma.searchProfile.update({
      where: { id: profileId },
      data: { lastRunStatus: "success", lastRunCount: count, lastRunError: null },
    });
    return count;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scrapen mislukt";
    console.error(`[importFunda] profile ${profileId}:`, message);
    await prisma.searchProfile.update({
      where: { id: profileId },
      data: { lastRunStatus: "error", lastRunError: message },
    });
    throw err;
  }
}

export async function runAllEnabledProfiles(): Promise<void> {
  const profiles = await prisma.searchProfile.findMany({
    where: { enabled: true },
  });

  for (const profile of profiles) {
    try {
      const count = await runSearchProfile(profile.id);
      console.log(`[importFunda] ${profile.name}: ${count} nieuwe huizen`);
    } catch (err) {
      console.error(`[importFunda] ${profile.name}:`, err);
    }
  }
}
