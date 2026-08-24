import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { CriteriaDTO } from "@/lib/types";

interface CriteriaRow {
  name: string;
  weight: string;
  description: string;
}

export default function CriteriaForm({ initial }: { initial: CriteriaDTO[] }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<CriteriaRow[]>(
    initial.length > 0
      ? initial.map((c) => ({
          name: c.name,
          weight: String(c.weight),
          description: c.description ?? "",
        }))
      : [{ name: "", weight: "25", description: "" }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | false>(false);
  const [rescoring, setRescoring] = useState(false);

  function update(index: number, patch: Partial<CriteriaRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function remove(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const criteria = rows
      .filter((r) => r.name.trim() !== "")
      .map((r) => ({
        name: r.name.trim(),
        weight: Number(r.weight) || 0,
        description: r.description.trim() || null,
      }));

    if (criteria.length === 0) {
      setError("Voeg minimaal één criterium toe");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/criteria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Opslaan mislukt");
      setSaved("Criteria opgeslagen");
      queryClient.invalidateQueries({ queryKey: ["criteria"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAndRescore() {
    setSaving(true);
    setError(null);
    setSaved(false);
    setRescoring(true);

    const criteria = rows
      .filter((r) => r.name.trim() !== "")
      .map((r) => ({
        name: r.name.trim(),
        weight: Number(r.weight) || 0,
        description: r.description.trim() || null,
      }));

    if (criteria.length === 0) {
      setError("Voeg minimaal één criterium toe");
      setSaving(false);
      setRescoring(false);
      return;
    }

    try {
      const saveRes = await fetch("/api/criteria", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criteria }),
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok) throw new Error(saveData.error ?? "Opslaan mislukt");
      queryClient.invalidateQueries({ queryKey: ["criteria"] });

      const rescoreRes = await fetch("/api/houses/rescore-all", {
        method: "POST",
      });
      const rescoreData = await rescoreRes.json();
      if (!rescoreRes.ok) throw new Error(rescoreData.error ?? "Scoren mislukt");
      setSaved(
        `Criteria opgeslagen en scores worden vernieuwd voor ${rescoreData.count} ${rescoreData.count === 1 ? "huis" : "huizen"}`,
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
      setRescoring(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        {rows.map((row, i) => (
          <div
            key={i}
            className="flex flex-col gap-2 rounded-2xl border border-cream-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
          >
            <input
              value={row.name}
              onChange={(e) => update(i, { name: e.target.value })}
              placeholder="Criteriumnaam (bijv. Locatie)"
              className="flex-1 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
            <input
              value={row.weight}
              onChange={(e) => update(i, { weight: e.target.value })}
              type="number"
              min={0}
              max={100}
              placeholder="Gewicht"
              className="w-24 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
            <button
              onClick={() => remove(i)}
              className="self-start rounded-lg px-2 py-1.5 text-sm text-brand-300 hover:text-brand-600 sm:self-auto"
            >
              Verwijderen
            </button>
            <input
              value={row.description}
              onChange={(e) => update(i, { description: e.target.value })}
              placeholder="Voorkeur (bijv. dicht bij station, grote tuin)"
              className="w-full rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white sm:mt-2 sm:w-full sm:basis-full"
            />
          </div>
        ))}
      </div>

      <button
        onClick={() => setRows((prev) => [...prev, { name: "", weight: "25", description: "" }])}
        className="self-start rounded-xl border border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        + Criterium toevoegen
      </button>

      {error && <p className="text-sm text-brand-600">{error}</p>}
      {saved && <p className="text-sm text-leaf-600">{saved}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Bezig met opslaan…" : "Criteria opslaan"}
        </button>
        <button
          onClick={handleSaveAndRescore}
          disabled={saving}
          className="rounded-xl bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-700 disabled:opacity-60"
        >
          {rescoring ? "Scores vernieuwen…" : "Opslaan en alle scores vernieuwen"}
        </button>
      </div>
    </div>
  );
}
