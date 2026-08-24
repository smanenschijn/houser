import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface HouseMapProps {
  latitude: number;
  longitude: number;
  label?: string | null;
}

const PIN_SVG = `
<svg width="36" height="46" viewBox="0 0 36 46" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 0C8.06 0 0 8.06 0 18c0 12.3 18 28 18 28s18-15.7 18-28C36 8.06 27.94 0 18 0z" fill="#f4612c"/>
  <circle cx="18" cy="18" r="7" fill="#ffffff"/>
</svg>`;

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export default function LeafletMap({
  latitude,
  longitude,
  label,
}: HouseMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const map = L.map(containerRef.current, {
      center: [latitude, longitude],
      zoom: 16,
      scrollWheelZoom: false,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    const icon = L.divIcon({
      className: "",
      html: PIN_SVG,
      iconSize: [36, 46],
      iconAnchor: [18, 44],
      popupAnchor: [0, -40],
    });

    const marker = L.marker([latitude, longitude], { icon }).addTo(map);
    if (label) {
      marker.bindPopup(escapeHtml(label));
      marker.openPopup();
    }

    return () => {
      map.remove();
    };
  }, [latitude, longitude, label]);

  return (
    <div
      ref={containerRef}
      className="h-72 w-full overflow-hidden rounded-2xl border border-cream-200"
    />
  );
}
