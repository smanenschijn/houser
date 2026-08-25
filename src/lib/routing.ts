import type { Coordinates } from "@/lib/geocode";

export type TravelMode = "walking" | "cycling" | "driving";

const OSRM_URL = "https://router.project-osrm.org/route/v1";

export interface RouteInfo {
  distanceMeters: number;
  durationSeconds: number;
}

export async function routeBetween(
  from: Coordinates,
  to: Coordinates,
  mode: TravelMode,
): Promise<RouteInfo | null> {
  const coords = `${from.longitude},${from.latitude};${to.longitude},${to.latitude}`;
  const url = `${OSRM_URL}/${mode}/${coords}?overview=false`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "houser-app/0.1 (local real-estate tool)" },
      cache: "no-store",
    });

    if (!res.ok) return null;

    const data = (await res.json()) as {
      code?: string;
      routes?: { distance?: number; duration?: number }[];
    };

    if (data.code !== "Ok" || !data.routes?.[0]) return null;

    const { distance, duration } = data.routes[0];
    if (typeof distance !== "number" || typeof duration !== "number") return null;

    return { distanceMeters: distance, durationSeconds: duration };
  } catch (err) {
    console.error(`[routing] ${mode} ${coords}:`, err);
    return null;
  }
}
