import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import ImageCarousel from "@/client/components/ImageCarousel";
import HouseMap from "@/client/components/HouseMap";
import DocumentUpload from "@/client/components/DocumentUpload";
import type {
  ScoreDTO,
  DocumentAnalysis,
  RiskSeverity,
  ReviewDTO,
} from "@/lib/types";
import { statusBadgeClass } from "@/client/lib/status";
import { api } from "@/client/lib/api";
import { useAuth } from "@/client/lib/useAuth";

interface HouseDetail {
  id: string;
  title: string | null;
  description: string | null;
  energyLabel: string | null;
  livingArea: number | null;
  plotSize: number | null;
  price: number | null;
  address: string | null;
  listingStatus: string | null;
  latitude: number | null;
  longitude: number | null;
  imagePath: string | null;
  images: string[];
  sourceFileName: string | null;
  fundaUrl: string | null;
  isNew: boolean;
  documentAnalysis: DocumentAnalysis | null;
  status: string;
  error: string | null;
  progress: number;
  progressLabel: string | null;
  createdAt: string;
  scores: ScoreDTO[];
  review: ReviewDTO | null;
}

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

function scoreBarColor(total: number): string {
  if (total >= 75) return "bg-leaf-500";
  if (total >= 50) return "bg-sun-400";
  return "bg-brand-500";
}

function severityStyles(severity: RiskSeverity): string {
  if (severity === "high") return "bg-brand-100 text-brand-700";
  if (severity === "medium") return "bg-sun-100 text-[#8a6d1a]";
  return "bg-sky-100 text-sky-600";
}

function severityLabel(severity: RiskSeverity): string {
  if (severity === "high") return "Hoog risico";
  if (severity === "medium") return "Middel risico";
  return "Laag risico";
}

interface ReviewSectionProps {
  houseId: string;
  review: ReviewDTO | null;
  authed: boolean;
  onSaved: (review: ReviewDTO) => void;
}

function ReviewSection({
  houseId,
  review,
  authed,
  onSaved,
}: ReviewSectionProps) {
  const [text, setText] = useState(review?.text ?? "");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!authed) {
    return null;
  }

  const hasReview = Boolean(review?.text);

  async function handleSave() {
    if (!text.trim()) {
      setError("Schrijf eerst je review");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const saved = await api.put<{ review: ReviewDTO }>(
        `/api/houses/${houseId}/review`,
        { text: text.trim() },
      );
      setEditing(false);
      onSaved(saved.review);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  }

  if (!editing && hasReview) {
    return (
      <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-brand-400">
            Mijn review
          </h2>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50"
          >
            Bewerken
          </button>
        </div>
        <p className="whitespace-pre-line text-brand-900">{review?.text}</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-400">
        {hasReview ? "Review bewerken" : "Review na bezichtiging"}
      </h2>
      <p className="mb-3 text-sm text-brand-700">
        Noteer je indruk van de bezichtiging. De score wordt na het opslaan
        opnieuw berekend met jouw review.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder="Wat viel je op tijdens de bezichtiging?"
        className="w-full resize-y rounded-xl border border-cream-200 bg-cream-50 px-3 py-2 text-brand-900 outline-none focus:border-brand-400 focus:ring-1 focus:ring-brand-300"
      />
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
        >
          {saving && (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          )}
          {saving ? "Opslaan…" : "Review opslaan"}
        </button>
        {hasReview && (
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setText(review?.text ?? "");
            }}
            className="rounded-lg border border-cream-200 px-4 py-2 text-sm font-medium text-brand-700 transition-colors hover:bg-cream-50"
          >
            Annuleren
          </button>
        )}
      </div>
      {error && <p className="mt-2 text-sm text-brand-600">{error}</p>}
    </div>
  );
}

export function HouseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { authed } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["house", id],
    queryFn: () => api.get<{ house: HouseDetail }>(`/api/houses/${id}`),
    refetchInterval: (query) => {
      const h = query.state.data?.house;
      return h &&
        ["processing", "refreshing", "scoring"].includes(h.status)
        ? 1500
        : false;
    },
  });

  const house = data?.house;

  useEffect(() => {
    if (!house || !authed) return;
    const needsGeocode =
      house.address &&
      (house.latitude == null || house.longitude == null) &&
      house.status !== "processing";
    if (!needsGeocode) return;

    let cancelled = false;
    api
      .post<{ latitude: number | null; longitude: number | null }>(
        `/api/houses/${house.id}/geocode`,
      )
      .then((coords) => {
        if (cancelled) return;
        if (coords?.latitude != null && coords?.longitude != null) {
          queryClient.invalidateQueries({ queryKey: ["house", house.id] });
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [house, authed, queryClient]);

  useEffect(() => {
    if (!house?.isNew || !authed) return;
    api
      .post(`/api/houses/${house.id}/seen`)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: ["houses"] });
        queryClient.setQueryData<{ house: HouseDetail }>(
          ["house", house.id],
          (old) =>
            old ? { ...old, house: { ...old.house, isNew: false } } : old,
        );
      })
      .catch(() => {});
  }, [house?.isNew, house?.id, authed, queryClient]);

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl items-center justify-center px-4 py-24">
        <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (isError || !house) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center px-4 py-24 text-center">
        <p className="font-display text-lg font-medium text-brand-900">
          Huis niet gevonden
        </p>
        <Link
          to="/"
          className="mt-3 text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          ← Terug naar huizen
        </Link>
      </div>
    );
  }

  const images = Array.isArray(house.images) ? house.images : [];
  const title = house.title ?? house.address ?? house.sourceFileName ?? "Huis";
  const latitude = house.latitude;
  const longitude = house.longitude;
  const scores: ScoreDTO[] = house.scores ?? [];
  const latest = scores[0] ?? null;
  const documentAnalysis = house.documentAnalysis as DocumentAnalysis | null;
  const energyLabelDoc = documentAnalysis?.energyLabel ?? {
    label: null,
    summary: null,
  };
  const questionnaireDoc = documentAnalysis?.questionnaire ?? {
    present: false,
    summary: null,
  };
  const itemsListDoc = documentAnalysis?.itemsList ?? {
    present: false,
    summary: null,
  };
  const riskFactors = documentAnalysis?.riskFactors ?? [];
  const docSummary = documentAnalysis?.summary ?? "";

  function handleDocumentUploaded(next: DocumentAnalysis) {
    queryClient.setQueryData<{ house: HouseDetail }>(["house", id], (old) => {
      if (!old) return old;
      return { ...old, house: { ...old.house, documentAnalysis: next } };
    });
  }

  function handleReviewSaved(review: ReviewDTO) {
    queryClient.setQueryData<{ house: HouseDetail }>(["house", id], (old) => {
      if (!old) return old;
      return { ...old, house: { ...old.house, review } };
    });
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          ← Terug naar huizen
        </Link>
        {latest && (
          <span
            className={`rounded-full px-3 py-1 text-lg font-semibold ${scoreColor(latest.total)}`}
          >
            Score {latest.total.toFixed(1)}
          </span>
        )}
      </div>

      {house.status === "processing" && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-sun-200 bg-sun-50 px-4 py-3 text-sm text-[#8a6d1a]">
          <svg className="h-5 w-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          De brochure wordt nog verwerkt. De gegevens verschijnen hier zodra dit klaar is.
        </div>
      )}

      {(house.status === "refreshing" || house.status === "scoring") && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-600">
          <svg className="h-5 w-5 shrink-0 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {house.status === "refreshing"
            ? "Het huis wordt bijgewerkt."
            : "De score wordt bijgewerkt."}
        </div>
      )}

      {house.status === "error" && (
        <div className="mb-6 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
          De brochure kon niet worden verwerkt: {house.error ?? "onbekende fout"}
        </div>
      )}

      <div className="mb-6">
        <h1 className="font-display text-3xl font-semibold text-brand-900">{title}</h1>
        {house.address && house.address !== title && (
          <p className="mt-1 text-brand-700">{house.address}</p>
        )}
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-4">
        <span className="text-2xl font-semibold text-brand-900">
          {formatEuro(house.price)}
        </span>
        {house.listingStatus && (
          <span
            className={`rounded-lg px-2.5 py-1 text-sm font-medium ${statusBadgeClass(house.listingStatus) ?? "bg-cream-200 text-brand-700"}`}
          >
            {house.listingStatus}
          </span>
        )}
        {house.energyLabel && (
          <span className="rounded-lg bg-leaf-50 px-2.5 py-1 text-sm font-medium text-leaf-700">
            Energielabel {house.energyLabel}
          </span>
        )}
        {house.livingArea != null && (
          <span className="rounded-lg bg-sky-100 px-2.5 py-1 text-sm font-medium text-sky-500">
            {house.livingArea} m² woonoppervlak
          </span>
        )}
        {house.plotSize != null && (
          <span className="rounded-lg bg-sun-100 px-2.5 py-1 text-sm font-medium text-[#8a6d1a]">
            {house.plotSize} m² perceel
          </span>
        )}
        {house.fundaUrl && (
          <a
            href={house.fundaUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

      {images.length > 0 && (
        <ImageCarousel
          images={images}
          title={title}
          houseId={house.id}
          tileImage={house.imagePath}
          authed={authed}
        />
      )}

      {latitude != null && longitude != null && (
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">
            Locatie
          </h2>
          <HouseMap
            latitude={latitude}
            longitude={longitude}
            label={house.address ?? title}
          />
        </div>
      )}

      {house.description && (
        <div className="mb-8 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-brand-400">
            Omschrijving
          </h2>
          <p className="whitespace-pre-line text-brand-900">{house.description}</p>
        </div>
      )}

      <div className="mb-8 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-400">
          Documenten &amp; risico&apos;s
        </h2>

        {docSummary && <p className="mb-6 text-brand-900">{docSummary}</p>}

        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-leaf-50 p-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-leaf-700">
              Energielabel
            </h3>
            <p className="text-sm text-brand-900">
              {energyLabelDoc.label
                ? `Label ${energyLabelDoc.label}`
                : "Niet vermeld"}
            </p>
            {energyLabelDoc.summary && (
              <p className="mt-1 text-xs text-brand-700">
                {energyLabelDoc.summary}
              </p>
            )}
            {authed && (
              <DocumentUpload
                houseId={house.id}
                type="energyLabel"
                label={
                  energyLabelDoc.label
                    ? "Energielabel vervangen"
                    : "Energielabel toevoegen"
                }
                replace={Boolean(energyLabelDoc.label)}
                onUploaded={handleDocumentUploaded}
              />
            )}
          </div>

          <div className="rounded-xl bg-sky-50 p-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-sky-600">
              Vragenlijst
            </h3>
            <p className="text-sm text-brand-900">
              {questionnaireDoc.present ? "Aanwezig" : "Niet aanwezig"}
            </p>
            {questionnaireDoc.summary && (
              <p className="mt-1 text-xs text-brand-700">
                {questionnaireDoc.summary}
              </p>
            )}
            {authed && (
              <DocumentUpload
                houseId={house.id}
                type="questionnaire"
                label={
                  questionnaireDoc.present
                    ? "Vragenlijst vervangen"
                    : "Vragenlijst toevoegen"
                }
                replace={Boolean(questionnaireDoc.present)}
                onUploaded={handleDocumentUploaded}
              />
            )}
          </div>

          <div className="rounded-xl bg-sun-50 p-3">
            <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#8a6d1a]">
              Lijst van zaken
            </h3>
            <p className="text-sm text-brand-900">
              {itemsListDoc.present ? "Aanwezig" : "Niet aanwezig"}
            </p>
            {itemsListDoc.summary && (
              <p className="mt-1 text-xs text-brand-700">
                {itemsListDoc.summary}
              </p>
            )}
            {authed && (
              <DocumentUpload
                houseId={house.id}
                type="itemsList"
                label={
                  itemsListDoc.present
                    ? "Lijst van zaken vervangen"
                    : "Lijst van zaken toevoegen"
                }
                replace={Boolean(itemsListDoc.present)}
                onUploaded={handleDocumentUploaded}
              />
            )}
          </div>
        </div>

        {riskFactors.length > 0 && (
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-400">
              Aandachtspunten
            </h3>
            <ul className="flex flex-col gap-2">
              {riskFactors.map((risk) => (
                <li
                  key={risk.title}
                  className="rounded-xl border border-cream-200 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-brand-900">
                      {risk.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${severityStyles(risk.severity)}`}
                    >
                      {severityLabel(risk.severity)}
                    </span>
                  </div>
                  {risk.detail && (
                    <p className="mt-1 text-sm text-brand-700">{risk.detail}</p>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mb-8">
        <ReviewSection
          houseId={house.id}
          review={house.review ?? null}
          authed={authed}
          onSaved={handleReviewSaved}
        />
      </div>

      {latest && (
        <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brand-400">
            Score &amp; redenering
          </h2>

          {latest.rationale && (
            <p className="mb-6 text-brand-900">{latest.rationale}</p>
          )}

          <div className="flex flex-col gap-4">
            {latest.criteriaSnapshot.map((item) => {
              const pct = Math.max(0, Math.min(100, item.score * 10));
              return (
                <div key={item.name} className="flex flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="font-medium text-brand-900">{item.name}</span>
                    <span className="text-sm text-brand-700">
                      <span className="font-semibold text-brand-900">
                        {item.score.toFixed(1)}
                      </span>
                      /10 · gewicht {item.weight}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-cream-200">
                    <div
                      className={`h-full rounded-full ${scoreBarColor(item.score * 10)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  {item.rationale && (
                    <p className="text-sm text-brand-700">{item.rationale}</p>
                  )}
                </div>
              );
            })}
          </div>

          {scores.length > 1 && (
            <div className="mt-6 border-t border-cream-200 pt-4">
              <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-brand-400">
                Eerdere scores
              </h3>
              <ul className="flex flex-col gap-1">
                {scores.slice(1).map((s) => (
                  <li
                    key={s.id}
                    className="flex items-center justify-between text-sm text-brand-700"
                  >
                    <span>
                      {new Date(s.createdAt).toLocaleString("nl-NL")}
                    </span>
                    <span className="font-semibold text-brand-900">
                      {s.total.toFixed(1)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
