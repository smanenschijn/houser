"use client";

import dynamic from "next/dynamic";
import type { HouseMapProps } from "./LeafletMap";

const LeafletMap = dynamic(() => import("./LeafletMap"), {
  ssr: false,
  loading: () => (
    <div className="h-72 w-full animate-pulse rounded-2xl border border-cream-200 bg-cream-100" />
  ),
});

export default function HouseMap(props: HouseMapProps) {
  return <LeafletMap {...props} />;
}
