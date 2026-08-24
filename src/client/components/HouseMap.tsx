import { lazy, Suspense } from "react";
import type { HouseMapProps } from "./LeafletMap";

const LeafletMap = lazy(() => import("./LeafletMap"));

export default function HouseMap(props: HouseMapProps) {
  return (
    <Suspense
      fallback={
        <div className="h-72 w-full animate-pulse rounded-2xl border border-cream-200 bg-cream-100" />
      }
    >
      <LeafletMap {...props} />
    </Suspense>
  );
}
