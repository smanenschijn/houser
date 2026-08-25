import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useQueryClient } from "@tanstack/react-query";
import type { HouseDTO } from "@/lib/types";
import { statusBadgeClass } from "@/client/lib/status";

function formatEuro(value: number | null): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
}

function scoreColor(total: number): string {
  if (total >= 75) return "bg-leaf-100 text-leaf-700";
  if (total >= 50) return "bg-sun-100 text-[#8a6d1a]";
  return "bg-brand-100 text-brand-700";
}

export default function HouseTile({ house }: { house: HouseDTO }) {
  const queryClient = useQueryClient();
  const [syncing, setSyncing] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState(house.status);
  const [progress, setProgress] = useState(house.progress ?? 0);
  const [progressLabel, setProgressLabel] = useState<string | null>(
    house.progressLabel ?? null,
  );
  const processing = status === "processing";
  const statusRefreshing = status === "refreshing";
  const statusScoring = status === "scoring";
  const busy = processing || statusRefreshing || statusScoring;

  useEffect(() => {
    if (!busy) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const res = await fetch(`/api/houses/${house.id}`);
        const data = await res.json();
        if (cancelled) return;
        const h = data.house;
        if (h) {
          setStatus(h.status);
          setProgress(h.progress ?? 0);
          setProgressLabel(h.progressLabel ?? null);
        }
        if (
          h?.status !== "processing" &&
          h?.status !== "refreshing" &&
          h?.status !== "scoring"
        ) {
          queryClient.invalidateQueries({ queryKey: ["houses"] });
          queryClient.invalidateQueries({ queryKey: ["house", house.id] });
        } else {
          setTimeout(poll, 800);
        }
      } catch {
        if (!cancelled) setTimeout(poll, 3000);
      }
    };
    const timer = setTimeout(poll, 800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [busy, house.id, queryClient]);

  const latestScore = house.scores[0] ?? null;
  const title = house.title ?? house.address ?? house.sourceFileName ?? "Huis";

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(event: PointerEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  async function handleSync() {
    setSyncing(true);
    setError(null);
    setStatus("scoring");
    try {
      const res = await fetch(`/api/houses/${house.id}/score`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scoren mislukt");
      setStatus("ready");
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      queryClient.invalidateQueries({ queryKey: ["house", house.id] });
    } catch (e) {
      setStatus("error");
      setError(e instanceof Error ? e.message : "Scoren mislukt");
    } finally {
      setSyncing(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    setError(null);
    setStatus("refreshing");
    try {
      const res = await fetch(`/api/houses/${house.id}/refresh`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Huis verversen mislukt");
      queryClient.invalidateQueries({ queryKey: ["houses"] });
      queryClient.invalidateQueries({ queryKey: ["house", house.id] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Huis verversen mislukt");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Weet je zeker dat je dit huis wilt archiveren? Je kunt het later herstellen.")) {
      return;
    }
    setError(null);
    try {
      const res = await fetch(`/api/houses/${house.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Archiveren mislukt");
      }
      queryClient.invalidateQueries({ queryKey: ["houses"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Archiveren mislukt");
    }
  }

  return (
    <div className="flex flex-col rounded-2xl border border-cream-200 bg-white shadow-sm transition-shadow hover:shadow-md">
      <Link to={`/houses/${house.id}`} className="relative block aspect-[4/3] w-full overflow-hidden rounded-t-2xl bg-cream-100">
        {house.imagePath ? (
          <img
            src={house.imagePath}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : processing ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-6 text-sm text-brand-500">
            <svg className="h-6 w-6 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-xs font-medium">
              {progressLabel ?? "Bezig met verwerken…"}
            </span>
            <div className="h-1.5 w-full max-w-[80%] overflow-hidden rounded-full bg-brand-100">
              <div
                className="h-full rounded-full bg-brand-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-brand-300">
            Geen afbeelding
          </div>
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1.5">
          {house.isNew && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 2.5l2.94 5.96 6.58.96-4.76 4.64 1.12 6.55L12 17.6l-5.88 3.01 1.12-6.55-4.76-4.64 6.58-.96L12 2.5z" />
              </svg>
              Nieuw
            </span>
          )}
          {processing && (
            <span className="rounded-full bg-sun-100 px-2.5 py-1 text-xs font-semibold text-[#8a6d1a]">
              {progress}%
            </span>
          )}
          {house.listingStatus &&
            house.listingStatus !== "te koop" &&
            !processing && (
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusBadgeClass(house.listingStatus)}`}
              >
                {house.listingStatus}
              </span>
            )}
          {status === "error" && (
            <span className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-semibold text-brand-700">
              Verwerking mislukt
            </span>
          )}
          {(statusRefreshing || statusScoring) && (
            <span className="flex items-center gap-1.5 rounded-full bg-sky-100 px-2.5 py-1 text-xs font-semibold text-sky-600">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              {statusRefreshing ? "Huis verversen…" : "Score bijwerken…"}
            </span>
          )}
        </div>
        {latestScore && (
          <span
            className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-sm font-semibold ${scoreColor(latestScore.total)}`}
          >
            {latestScore.total.toFixed(1)}
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link to={`/houses/${house.id}`}>
            <h3 className="font-semibold text-brand-900 hover:underline">{title}</h3>
          </Link>
          {house.address && house.address !== title && (
            <p className="text-sm text-brand-700">{house.address}</p>
          )}
          {house.fundaUrl && (
            <a
              href={house.fundaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-brand-500 hover:text-brand-700"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M15 3h6v6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 14L21 3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Bekijk op Funda
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {house.energyLabel && (
            <span className="rounded-lg bg-leaf-50 px-2 py-1 font-medium text-leaf-700">
              Energielabel {house.energyLabel}
            </span>
          )}
          {house.livingArea != null && (
            <span className="rounded-lg bg-sky-100 px-2 py-1 font-medium text-sky-500">
              {house.livingArea} m² woonoppervlak
            </span>
          )}
          {house.plotSize != null && (
            <span className="rounded-lg bg-sun-100 px-2 py-1 font-medium text-[#8a6d1a]">
              {house.plotSize} m² perceel
            </span>
          )}
          {house.documentAnalysis &&
            house.documentAnalysis.riskFactors.length > 0 && (
              <span className="rounded-lg bg-brand-50 px-2 py-1 font-medium text-brand-700">
                {house.documentAnalysis.riskFactors.length} aandachtspunt
                {house.documentAnalysis.riskFactors.length === 1 ? "" : "en"}
              </span>
            )}
        </div>

        {house.description && (
          <p className="line-clamp-3 text-sm text-brand-700">{house.description}</p>
        )}

        <div className="mt-auto flex items-center justify-between pt-1">
          <span className="text-base font-semibold text-brand-900">
            {formatEuro(house.price)}
          </span>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((open) => !open)}
              className="flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-brand-600"
            >
              Acties
              <svg
                className={`h-3.5 w-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`}
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 9l6 6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-10 mt-1 w-48 overflow-hidden rounded-xl border border-cream-200 bg-white py-1 shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleSync();
                  }}
                  disabled={syncing || processing}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-brand-900 hover:bg-brand-50 disabled:opacity-60"
                >
                  {syncing ? "Bezig met bijwerken…" : "Score bijwerken"}
                </button>
                {house.source === "funda" && (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      handleRefresh();
                    }}
                    disabled={refreshing || statusRefreshing || processing}
                    className="flex w-full items-center px-3 py-2 text-left text-sm text-brand-900 hover:bg-brand-50 disabled:opacity-60"
                  >
                    {refreshing || statusRefreshing
                      ? "Verversen…"
                      : "Huis verversen"}
                  </button>
                )}
                <div className="my-1 h-px bg-cream-200" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleDelete();
                  }}
                  className="flex w-full items-center px-3 py-2 text-left text-sm text-brand-600 hover:bg-brand-50"
                >
                  Archiveren
                </button>
              </div>
            )}
          </div>
        </div>

        {error && <p className="text-xs text-brand-600">{error}</p>}
        {status === "error" && house.error && (
          <p className="text-xs text-brand-600">{house.error}</p>
        )}
      </div>
    </div>
  );
}
