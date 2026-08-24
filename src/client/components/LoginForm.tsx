import { useState } from "react";
import { useNavigate } from "react-router";
import { useQueryClient } from "@tanstack/react-query";

export default function LoginForm({ next }: { next: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const user = form.get("user");
    const password = form.get("password");

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user, password }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Inloggen mislukt");
      }
      queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate(next, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Inloggen mislukt");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="user"
          className="text-xs font-semibold uppercase tracking-wide text-brand-400"
        >
          Gebruikersnaam
        </label>
        <input
          id="user"
          name="user"
          type="text"
          autoComplete="username"
          autoFocus
          required
          className="rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-300 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          placeholder="jouw gebruikersnaam"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-xs font-semibold uppercase tracking-wide text-brand-400"
        >
          Wachtwoord
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="rounded-xl border border-cream-200 bg-cream-50 px-3.5 py-2.5 text-sm text-brand-900 outline-none transition-colors placeholder:text-brand-300 focus:border-brand-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-brand-200 bg-brand-50 px-3.5 py-2.5 text-sm text-brand-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-1 rounded-full bg-brand-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:pointer-events-none disabled:opacity-60"
      >
        {loading ? "Bezig met inloggen…" : "Inloggen"}
      </button>
    </form>
  );
}
