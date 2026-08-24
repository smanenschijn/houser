export const LISTING_STATUSES = [
  "te koop",
  "onder bod",
  "verkocht onder voorbehoud",
  "verkocht",
] as const;

export type ListingStatus = (typeof LISTING_STATUSES)[number];

export function normalizeListingStatus(
  raw: string | null | undefined,
): ListingStatus | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s.includes("onder bod")) return "onder bod";
  if (s.includes("verkocht onder voorbehoud")) {
    return "verkocht onder voorbehoud";
  }
  if (s.includes("verkocht")) return "verkocht";
  if (s.includes("beschikbaar") || s.includes("te koop")) return "te koop";
  return null;
}
