import { useState } from "react";
import type { SearchProfileDTO } from "@/lib/types";

const OBJECT_TYPE_OPTIONS = [
  { value: "house", label: "Huis" },
  { value: "apartment", label: "Appartement" },
];

export interface FormValues {
  name: string;
  cities: string[];
  priceMin: string;
  priceMax: string;
  objectTypes: string[];
  livingAreaMin: string;
  enabled: boolean;
}

export interface SearchProfileFormProps {
  initial: SearchProfileDTO | null;
  onSave: (values: FormValues) => Promise<void>;
  onCancel?: () => void;
}

export default function SearchProfileForm({
  initial,
  onSave,
  onCancel,
}: SearchProfileFormProps) {
  const [values, setValues] = useState<FormValues>({
    name: initial?.name ?? "",
    cities: initial?.cities ?? [],
    priceMin: initial?.priceMin != null ? String(initial.priceMin) : "",
    priceMax: initial?.priceMax != null ? String(initial.priceMax) : "",
    objectTypes: initial?.objectTypes ?? ["house"],
    livingAreaMin:
      initial?.livingAreaMin != null ? String(initial.livingAreaMin) : "",
    enabled: initial?.enabled ?? true,
  });
  const [cityInput, setCityInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addCity(raw: string) {
    const name = raw.trim();
    if (!name) return;
    setValues((prev) =>
      prev.cities.some((c) => c.toLowerCase() === name.toLowerCase())
        ? prev
        : { ...prev, cities: [...prev.cities, name] },
    );
    setCityInput("");
  }

  function removeCity(name: string) {
    setValues((prev) => ({
      ...prev,
      cities: prev.cities.filter((c) => c !== name),
    }));
  }

  function toggleObjectType(value: string) {
    setValues((prev) => ({
      ...prev,
      objectTypes: prev.objectTypes.includes(value)
        ? prev.objectTypes.filter((v) => v !== value)
        : [...prev.objectTypes, value],
    }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError(null);

    if (values.name.trim() === "") {
      setError("Geef de zoekopdracht een naam");
      setSaving(false);
      return;
    }
    if (values.cities.length === 0) {
      setError("Voeg minimaal één plaats toe");
      setSaving(false);
      return;
    }

    try {
      await onSave(values);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-400">
            Naam
          </label>
          <input
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            placeholder="Bijv. Utrecht & omgeving"
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-400">
            Plaatsen
          </label>
          {values.cities.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {values.cities.map((name) => (
                <button
                  key={name}
                  onClick={() => removeCity(name)}
                  className="rounded-full bg-brand-100 px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-200"
                >
                  {name} ×
                </button>
              ))}
            </div>
          )}
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                addCity(cityInput);
              }
            }}
            onBlur={() => addCity(cityInput)}
            placeholder="Typ een plaats en druk op Enter (bijv. Nijverdal, Hellendoorn)"
            className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-400">
            Type woning
          </label>
          <div className="flex flex-wrap gap-3">
            {OBJECT_TYPE_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 text-sm text-brand-900"
              >
                <input
                  type="checkbox"
                  checked={values.objectTypes.includes(opt.value)}
                  onChange={() => toggleObjectType(opt.value)}
                  className="accent-brand-500"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-400">
              Min. prijs
            </label>
            <input
              value={values.priceMin}
              onChange={(e) =>
                setValues((v) => ({ ...v, priceMin: e.target.value }))
              }
              type="number"
              min={0}
              placeholder="250000"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-400">
              Max. prijs
            </label>
            <input
              value={values.priceMax}
              onChange={(e) =>
                setValues((v) => ({ ...v, priceMax: e.target.value }))
              }
              type="number"
              min={0}
              placeholder="500000"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-brand-400">
              Min. woonopp. (m²)
            </label>
            <input
              value={values.livingAreaMin}
              onChange={(e) =>
                setValues((v) => ({ ...v, livingAreaMin: e.target.value }))
              }
              type="number"
              min={0}
              placeholder="80"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
          </div>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-brand-900">
          <input
            type="checkbox"
            checked={values.enabled}
            onChange={(e) =>
              setValues((v) => ({ ...v, enabled: e.target.checked }))
            }
            className="accent-brand-500"
          />
          Actief (automatisch uitvoeren)
        </label>
      </div>

      {error && <p className="text-sm text-brand-600">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Bezig met opslaan…" : "Opslaan"}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="rounded-xl border border-cream-300 bg-white px-4 py-2 text-sm font-medium text-brand-700 hover:bg-cream-50"
          >
            Annuleren
          </button>
        )}
      </div>
    </div>
  );
}
