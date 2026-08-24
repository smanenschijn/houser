import { useState } from "react";
import { Link } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import SearchProfileForm, {
  type FormValues,
} from "@/client/components/SearchProfileForm";
import type { SearchProfileDTO } from "@/lib/types";
import { api } from "@/client/lib/api";

function formatRun(profile: SearchProfileDTO): string {
  if (!profile.lastRunAt) return "Nog niet uitgevoerd";
  const time = new Date(profile.lastRunAt).toLocaleString("nl-NL", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
  if (profile.lastRunStatus === "running") return `Bezig… (${time})`;
  if (profile.lastRunStatus === "error") return `Mislukt (${time})`;
  return `${profile.lastRunCount ?? 0} nieuw · ${time}`;
}

export function SearchProfilesPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["search-profiles"],
    queryFn: () =>
      api.get<{ profiles: SearchProfileDTO[] }>("/api/search-profiles"),
  });
  const [editing, setEditing] = useState<"new" | string | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const profiles = data?.profiles ?? [];
  const editingProfile =
    editing !== "new"
      ? profiles.find((p) => p.id === editing) ?? null
      : null;

  async function handleSave(values: FormValues) {
    const body = {
      name: values.name.trim(),
      cities: values.cities,
      priceMin: values.priceMin ? Number(values.priceMin) : null,
      priceMax: values.priceMax ? Number(values.priceMax) : null,
      objectTypes: values.objectTypes,
      livingAreaMin: values.livingAreaMin ? Number(values.livingAreaMin) : null,
      enabled: values.enabled,
    };

    if (editingProfile) {
      await api.put(`/api/search-profiles/${editingProfile.id}`, body);
    } else {
      await api.post("/api/search-profiles", body);
    }
    queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
    setEditing(null);
  }

  async function handleRun(profile: SearchProfileDTO) {
    setRunning(profile.id);
    setError(null);
    try {
      await api.post(`/api/search-profiles/${profile.id}/run`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uitvoeren mislukt");
    } finally {
      setRunning(null);
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
    }
  }

  async function handleDelete(profile: SearchProfileDTO) {
    if (!window.confirm("Deze zoekopdracht verwijderen?")) return;
    setError(null);
    try {
      await api.del(`/api/search-profiles/${profile.id}`);
      queryClient.invalidateQueries({ queryKey: ["search-profiles"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verwijderen mislukt");
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-3xl font-semibold text-brand-900">
          Zoekopdrachten
        </h1>
        <Link
          to="/"
          className="text-sm font-medium text-brand-700 hover:text-brand-900"
        >
          ← Terug naar huizen
        </Link>
      </div>
      <p className="mb-6 text-sm text-brand-700">
        Laat funda automatisch (driemaal per dag) zoeken naar woningen die aan
        deze filters voldoen. Nieuwe woningen worden direct toegevoegd en
        gescoord.
      </p>

      {error && <p className="mb-4 text-sm text-brand-600">{error}</p>}

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <svg className="h-8 w-8 animate-spin text-brand-500" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-col gap-4">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold text-brand-900">
                        {profile.name}
                      </h2>
                      {profile.enabled ? (
                        <span className="rounded-full bg-leaf-100 px-2 py-0.5 text-xs font-semibold text-leaf-700">
                          Actief
                        </span>
                      ) : (
                        <span className="rounded-full bg-cream-200 px-2 py-0.5 text-xs font-semibold text-brand-400">
                          Inactief
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-brand-700">
                      {profile.cities.join(", ")}
                    </p>
                    <p className="mt-1 text-xs text-brand-400">
                      {[
                        profile.priceMin != null
                          ? `≥ €${profile.priceMin.toLocaleString("nl-NL")}`
                          : null,
                        profile.priceMax != null
                          ? `≤ €${profile.priceMax.toLocaleString("nl-NL")}`
                          : null,
                        profile.livingAreaMin != null
                          ? `≥ ${profile.livingAreaMin} m²`
                          : null,
                        profile.objectTypes.length === 1
                          ? profile.objectTypes[0] === "house"
                            ? "Huis"
                            : "Appartement"
                          : "Huis + appartement",
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    <p className="mt-1 text-xs text-brand-400">
                      {formatRun(profile)}
                    </p>
                    {profile.lastRunError && (
                      <p className="mt-1 text-xs text-brand-600">
                        {profile.lastRunError}
                      </p>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => handleRun(profile)}
                    disabled={running === profile.id}
                    className="rounded-lg bg-brand-500 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
                  >
                    {running === profile.id ? "Bezig…" : "Nu uitvoeren"}
                  </button>
                  <button
                    onClick={() =>
                      setEditing(editing === profile.id ? null : profile.id)
                    }
                    className="rounded-lg border border-cream-300 bg-white px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-cream-50"
                  >
                    {editing === profile.id ? "Sluiten" : "Bewerken"}
                  </button>
                  <button
                    onClick={() => handleDelete(profile)}
                    className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand-600 hover:bg-brand-50"
                  >
                    Verwijderen
                  </button>
                </div>

                {editing === profile.id && (
                  <div className="mt-4">
                    <SearchProfileForm
                      initial={profile}
                      onSave={handleSave}
                      onCancel={() => setEditing(null)}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {editing === "new" ? (
            <SearchProfileForm
              initial={null}
              onSave={handleSave}
              onCancel={() => setEditing(null)}
            />
          ) : (
            <button
              onClick={() => setEditing("new")}
              className="rounded-xl border border-brand-300 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
            >
              + Nieuwe zoekopdracht
            </button>
          )}
        </>
      )}
    </div>
  );
}
