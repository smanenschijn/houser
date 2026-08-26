import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { SchoolDTO } from "@/lib/types";

interface SchoolRow {
  name: string;
  address: string;
}

export default function SchoolsForm({ initial }: { initial: SchoolDTO[] }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = useState<SchoolRow[]>(
    initial.length > 0
      ? initial.map((s) => ({ name: s.name, address: s.address }))
      : [{ name: "", address: "" }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | false>(false);

  function update(index: number, patch: Partial<SchoolRow>) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  function remove(index: number) {
    setRows((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const schools = rows
      .filter((r) => r.name.trim() !== "" || r.address.trim() !== "")
      .map((r) => ({
        name: r.name.trim(),
        address: r.address.trim(),
      }));

    if (schools.some((s) => !s.name || !s.address)) {
      setError("Vul voor elke school zowel een naam als adres in");
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/schools", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schools }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Opslaan mislukt");
      setSaved("Basisscholen opgeslagen");
      queryClient.invalidateQueries({ queryKey: ["schools"] });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Opslaan mislukt");
    } finally {
      setSaving(false);
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
              placeholder="Naam (bijv. De Regenboog)"
              className="flex-1 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
            <input
              value={row.address}
              onChange={(e) => update(i, { address: e.target.value })}
              placeholder="Adres (bijv. Regenboogstraat 1, Utrecht)"
              className="flex-1 rounded-xl border border-cream-300 bg-cream-50 px-3 py-2 text-sm outline-none focus:border-brand-400 focus:bg-white"
            />
            <button
              onClick={() => remove(i)}
              className="self-start rounded-lg px-2 py-1.5 text-sm text-brand-300 hover:text-brand-600 sm:self-auto"
            >
              Verwijderen
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => setRows((prev) => [...prev, { name: "", address: "" }])}
        className="self-start rounded-xl border border-brand-300 bg-white px-3 py-2 text-sm font-medium text-brand-700 hover:bg-brand-100"
      >
        + Basisschool toevoegen
      </button>

      {error && <p className="text-sm text-brand-600">{error}</p>}
      {saved && <p className="text-sm text-leaf-600">{saved}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-brand-600 disabled:opacity-60"
        >
          {saving ? "Bezig met opslaan…" : "Basisscholen opslaan"}
        </button>
      </div>
    </div>
  );
}
