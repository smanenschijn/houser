import type { Coordinates } from "@/lib/geocode";

export type TravelMode = "walking" | "cycling" | "driving";

const VALHALLA_URL = "https://valhalla1.openstreetmap.de/route";

const COSTING: Record<TravelMode, string> = {
  walking: "pedestrian",
  cycling: "bicycle",
  driving: "auto",
};

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

export async function routeBetween(
  from: Coordinates,
  to: Coordinates,
  mode: TravelMode,
): Promise<RouteInfo | null> {
  const body = {
    locations: [
      { lat: from.latitude, lon: from.longitude },
      { lat: to.latitude, lon: to.longitude },
    ],
    costing: COSTING[mode],
    units: "kilometers",
  };

  try {
    const res = await fetch(VALHALLA_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "houser-app/0.1 (local real-estate tool)",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      trip?: { summary?: { length?: number; time?: number } };
      error_code?: number;
    };

    if (data.error_code) return null;

    const summary = data.trip?.summary;
    if (!summary || typeof summary.length !== "number" || typeof summary.time !== "number") {
      return null;
    }

    return {
      distanceMeters: Math.round(summary.length * 1000),
      durationSeconds: Math.round(summary.time),
    };
  } catch (err) {
    console.error(`[routing] ${mode}:`, err);
    return null;
  }
}
