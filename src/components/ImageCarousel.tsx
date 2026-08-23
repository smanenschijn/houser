"use client";

import { useEffect, useState } from "react";

const AUTOPLAY_MS = 3000;

export default function ImageCarousel({
  images,
  title,
}: {
  images: string[];
  title: string;
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = images.length;

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

  if (count === 0) return null;

  const current = images[index];

  return (
    <div
      className="mb-8"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-2xl border border-cream-200 bg-cream-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current}
          alt={`${title} afbeelding ${index + 1}`}
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
              {index + 1} / {count}
            </span>
          </>
        )}
      </div>

      {count > 1 && (
        <div className="mt-3 grid grid-cols-6 gap-2 sm:grid-cols-8">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Toon afbeelding ${i + 1}`}
              className={`overflow-hidden rounded-xl border-2 transition ${
                i === index
                  ? "border-brand-500 ring-2 ring-brand-200"
                  : "border-cream-200 opacity-70 hover:opacity-100"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt={`${title} afbeelding ${i + 1}`}
                className="aspect-square w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
