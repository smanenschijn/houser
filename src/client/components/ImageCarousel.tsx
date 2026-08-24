import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

const AUTOPLAY_MS = 3000;

export default function ImageCarousel({
  images,
  title,
  houseId,
  tileImage,
}: {
  images: string[];
  title: string;
  houseId?: string;
  tileImage?: string | null;
}) {
  const queryClient = useQueryClient();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const count = images.length;
  const manageable = Boolean(houseId);

  const goTo = (next: number) => {
    if (count === 0) return;
    setIndex(((next % count) + count) % count);
  };

  const next = () => setIndex((i) => (i + 1) % count);
  const prev = () => setIndex((i) => (i - 1 + count) % count);

  useEffect(() => {
    if (count <= 1 || paused) return;
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [count, paused]);

  async function setTile(src: string) {
    if (!houseId) return;
    setBusy(`tile:${src}`);
    setError(null);
    try {
      const res = await fetch(`/api/houses/${houseId}/image`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: src }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Hoofdfoto instellen mislukt");
      queryClient.invalidateQueries({ queryKey: ["house", houseId] });
      queryClient.invalidateQueries({ queryKey: ["houses"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hoofdfoto instellen mislukt");
    } finally {
      setBusy(null);
    }
  }

  async function remove(src: string) {
    if (!houseId) return;
    if (!window.confirm("Weet je zeker dat je deze foto wilt verwijderen?")) {
      return;
    }
    setBusy(`delete:${src}`);
    setError(null);
    try {
      const res = await fetch(`/api/houses/${houseId}/image`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imagePath: src }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Foto verwijderen mislukt");
      queryClient.invalidateQueries({ queryKey: ["house", houseId] });
      queryClient.invalidateQueries({ queryKey: ["houses"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Foto verwijderen mislukt");
    } finally {
      setBusy(null);
    }
  }

  if (count === 0) return null;

  const safeIndex = Math.min(index, count - 1);
  const current = images[safeIndex];

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-cream-200 bg-cream-100">
        <img
          src={current}
          alt={`${title} afbeelding ${safeIndex + 1}`}
          className="aspect-[4/3] w-full object-cover"
        />

        {count > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Vorige afbeelding"
              className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-900 shadow-sm transition hover:bg-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Volgende afbeelding"
              className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/80 text-brand-900 shadow-sm transition hover:bg-white"
            >
              <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5" aria-hidden="true">
                <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2.5 py-1 text-xs font-medium text-white">
              {safeIndex + 1} / {count}
            </span>
          </>
        )}

        {manageable && current === tileImage && (
          <span className="absolute bottom-3 left-3 rounded-full bg-brand-500 px-2.5 py-1 text-xs font-semibold text-white">
            Hoofdfoto
          </span>
        )}
      </div>

      {(count > 1 || manageable) && (
        <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8">
          {images.map((src, i) => {
            const isTile = src === tileImage;
            const active = i === safeIndex;
            return (
              <div key={src} className="relative">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={`Toon afbeelding ${i + 1}`}
                  className={`block w-full overflow-hidden rounded-xl border-2 transition ${
                    active
                      ? "border-brand-500 ring-2 ring-brand-200"
                      : "border-cream-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={src}
                    alt={`${title} afbeelding ${i + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </button>

                {manageable && isTile && (
                  <span className="absolute left-1 top-1 rounded-full bg-brand-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                    Hoofdfoto
                  </span>
                )}

                {manageable && (
                  <div className="absolute bottom-1 right-1 flex gap-1">
                    {!isTile && (
                      <button
                        type="button"
                        onClick={() => setTile(src)}
                        disabled={busy !== null}
                        title="Als hoofdfoto instellen"
                        className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-brand-700 shadow-sm transition hover:bg-white disabled:opacity-50"
                      >
                        <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                          <path d="M12 3l2.7 5.5 6 .9-4.3 4.2 1 6-5.4-2.8-5.4 2.8 1-6L3.3 9.4l6-.9L12 3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                        </svg>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => remove(src)}
                      disabled={busy !== null}
                      title="Foto verwijderen"
                      className="flex h-6 w-6 items-center justify-center rounded-md bg-white/90 text-brand-600 shadow-sm transition hover:bg-white disabled:opacity-50"
                    >
                      <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                        <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13a1 1 0 001 1h8a1 1 0 001-1l1-13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
    </div>
  );
}
