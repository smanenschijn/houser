import { chromium } from "playwright-extra";
import stealth from "puppeteer-extra-plugin-stealth";
import type { Browser, Page } from "playwright";
import { normalizeListingStatus } from "@/lib/listingStatus";

chromium.use(stealth());

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const FUNDA_SEARCH_URL = "https://www.funda.nl/zoeken/koop";
const REQUEST_DELAY_MS = 800;
const NAV_TIMEOUT_MS = 60000;

export interface FundaSearchFilters {
  cities: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  objectTypes: string[];
  livingAreaMin?: number | null;
}

export interface FundaListingRef {
  fundaId: string;
  url: string;
}

export interface FundaListing extends FundaListingRef {
  title: string | null;
  description: string | null;
  energyLabel: string | null;
  livingArea: number | null;
  plotSize: number | null;
  price: number | null;
  address: string | null;
  listingStatus: string | null;
  imageUrls: string[];
}

export async function launchFundaBrowser(): Promise<Browser> {
  return chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled", "--no-sandbox"],
  });
}

export async function newFundaPage(browser: Browser): Promise<Page> {
  const context = await browser.newContext({
    userAgent: USER_AGENT,
    locale: "nl-NL",
    viewport: { width: 1440, height: 900 },
    extraHTTPHeaders: {
      "accept-language": "nl-NL,nl;q=0.9,en;q=0.8",
    },
  });
  return context.newPage();
}

function slugifyCity(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/'/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function buildSearchUrl(
  city: string,
  filters: FundaSearchFilters,
  page: number,
): string {
  const params = new URLSearchParams();
  params.set("selected_area", JSON.stringify([slugifyCity(city)]));
  if (filters.objectTypes.length > 0) {
    params.set("object_type", JSON.stringify(filters.objectTypes));
  }
  if (filters.priceMin != null || filters.priceMax != null) {
    const min = filters.priceMin ?? 0;
    const max = filters.priceMax ?? "";
    params.set("price", `"${min}-${max}"`);
  }
  if (filters.livingAreaMin != null) {
    params.set("woonoppervlakte", `"${filters.livingAreaMin}-"`);
  }
  params.set("search_result", "1");
  if (page > 1) {
    params.set("page", String(page));
  }
  return `${FUNDA_SEARCH_URL}?${params.toString()}`;
}

function extractIdFromUrl(url: string): string | null {
  const match = url.match(/\/(\d+)\/?$/);
  return match ? match[1] : null;
}

async function extractItemListUrls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const scripts = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ];
    const urls: string[] = [];
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent ?? "");
        const types = Array.isArray(parsed["@type"])
          ? parsed["@type"]
          : [parsed["@type"]];
        if (
          types.includes("ItemList") &&
          Array.isArray(parsed.itemListElement)
        ) {
          for (const item of parsed.itemListElement) {
            if (typeof item?.url === "string") urls.push(item.url);
          }
        }
      } catch {
        // skip malformed JSON-LD blocks
      }
    }
    return urls;
  });
}

export async function scrapeSearchListingRefs(
  page: Page,
  filters: FundaSearchFilters,
  maxPages: number,
): Promise<FundaListingRef[]> {
  const refs = new Map<string, FundaListingRef>();

  for (const city of filters.cities) {
    for (let p = 1; p <= maxPages; p++) {
      const url = buildSearchUrl(city, filters, p);
      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: NAV_TIMEOUT_MS,
      });
      await page.waitForTimeout(REQUEST_DELAY_MS);

      const urls = await extractItemListUrls(page);
      for (const listingUrl of urls) {
        const fundaId = extractIdFromUrl(listingUrl);
        if (fundaId && !refs.has(fundaId)) {
          refs.set(fundaId, { fundaId, url: listingUrl });
        }
      }

      if (urls.length === 0) break;
    }
  }

  return [...refs.values()];
}

function parseArea(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/([\d.,]+)\s*m[²2]/i);
  if (!match) return null;
  const num = Number.parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  return Number.isNaN(num) ? null : num;
}

function parsePrice(value: string | null | undefined): number | null {
  if (!value) return null;
  const match = value.match(/([\d.,]+)/);
  if (!match) return null;
  const num = Number.parseFloat(match[1].replace(/\./g, "").replace(",", "."));
  return Number.isNaN(num) ? null : num;
}

function extractPostalCode(text: string): string | null {
  const match = text.match(/\b\d{4}\s?[A-Za-z]{2}\b/);
  return match ? match[0] : null;
}

export async function scrapeListingDetail(
  page: Page,
  url: string,
): Promise<FundaListing> {
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: NAV_TIMEOUT_MS });
  await page.waitForTimeout(REQUEST_DELAY_MS);

  const fundaId = extractIdFromUrl(url) ?? "";

  const product = await page.evaluate(() => {
    const scripts = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ];
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent ?? "");
        const types = Array.isArray(parsed["@type"])
          ? parsed["@type"]
          : [parsed["@type"]];
        if (types.includes("Product")) return parsed;
      } catch {
        // skip
      }
    }
    return null;
  });

  const title = await page.title();
  const postalCode =
    extractPostalCode(product?.description ?? "") ?? extractPostalCode(title);

  const address = await page.evaluate(() => {
    const scripts = [
      ...document.querySelectorAll('script[type="application/ld+json"]'),
    ];
    for (const script of scripts) {
      try {
        const parsed = JSON.parse(script.textContent ?? "");
        const types = Array.isArray(parsed["@type"])
          ? parsed["@type"]
          : [parsed["@type"]];
        if (types.includes("Product") && parsed.address) return parsed.address;
      } catch {
        // skip
      }
    }
    return null;
  });

  const description = await page.evaluate(() => {
    const headings = [...document.querySelectorAll("h1,h2,h3,h4")];
    const heading = headings.find(
      (h) => h.textContent?.trim() === "Omschrijving",
    );
    if (!heading) return null;
    const container = heading.nextElementSibling;
    if (!container) return null;
    const text = container.textContent?.trim();
    return text && text.length > 0 ? text : null;
  });

  const features = await page.evaluate(() => {
    const pairs: Record<string, string> = {};
    const dts = [...document.querySelectorAll("dt")];
    for (const dt of dts) {
      const key = dt.textContent?.trim();
      if (!key || pairs[key]) continue;
      const dd = dt.nextElementSibling;
      pairs[key] = dd?.textContent?.trim() ?? "";
    }
    return pairs;
  });

  const street = (address as { streetAddress?: string } | null)?.streetAddress ?? null;
  const locality = (address as { addressLocality?: string } | null)?.addressLocality ?? null;

  const streetAddress = street
    ? postalCode
      ? `${street}, ${postalCode} ${locality ?? ""}`.trim()
      : `${street}${locality ? `, ${locality}` : ""}`.trim()
    : null;

  const imageUrls: string[] = [];
  const mainImage = product?.image;
  if (typeof mainImage === "string") imageUrls.push(mainImage);
  if (Array.isArray(product?.photo)) {
    for (const photo of product.photo) {
      if (typeof photo?.contentUrl === "string") imageUrls.push(photo.contentUrl);
    }
  }

  const price = Number.isFinite(Number(product?.offers?.price))
    ? Number(product?.offers?.price)
    : parsePrice(features["Vraagprijs"]);

  const livingArea = parseArea(features["Wonen"]);
  const plotSize =
    parseArea(features["Perceel"]) ??
    parseArea(features["Perceeloppervlakte"]) ??
    parseArea(features["Kavel"]);

  const energyLabel = features["Energielabel"]?.trim() || null;

  return {
    fundaId,
    url,
    title: street ?? null,
    description,
    energyLabel,
    livingArea,
    plotSize,
    price,
    address: streetAddress,
    listingStatus: normalizeListingStatus(features["Status"]),
    imageUrls: [...new Set(imageUrls)],
  };
}
