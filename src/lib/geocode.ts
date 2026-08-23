export interface Coordinates {
  latitude: number;
  longitude: number;
}

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

export async function geocodeAddress(
  address: string,
): Promise<Coordinates | null> {
  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", address);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  try {
    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent": "houser-app/0.1 (local real-estate tool)",
        Accept: "application/json",
      },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const results = (await res.json()) as { lat?: string; lon?: string }[];
    const first = results[0];
    if (!first?.lat || !first?.lon) return null;

    const latitude = Number.parseFloat(first.lat);
    const longitude = Number.parseFloat(first.lon);
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) return null;

    return { latitude, longitude };
  } catch (err) {
    console.error(`[geocode] ${address}:`, err);
    return null;
  }
}
