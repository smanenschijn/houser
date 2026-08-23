"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function UploadForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/houses", { method: "POST", body: formData });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Uploaden mislukt");
      }

      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uploaden mislukt");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="rounded-2xl border border-cream-200 bg-white p-5 shadow-sm">
      <label
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50 px-6 py-8 text-center transition-colors hover:border-brand-400 hover:bg-brand-100/60 ${
          uploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf,.pdf"
          className="hidden"
          disabled={uploading}
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg
          width="40"
          height="40"
          viewBox="0 0 48 48"
          fill="none"
          aria-hidden="true"
          className="mb-1"
        >
          <rect x="6" y="14" width="36" height="28" rx="6" fill="#fff5f0" stroke="#f4612c" strokeWidth="3" />
          <path d="M10 14 V10 A6 6 0 0 1 22 10" stroke="#f4612c" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M20 28 L28 36 L40 22" stroke="#f4612c" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
        <span className="font-display text-base font-medium text-brand-800">
          {uploading ? "Uploaden…" : "Upload een PDF-brochure"}
        </span>
        <span className="text-xs text-brand-700">
          Omschrijving, kenmerken en hoofdfoto worden automatisch uitgelezen
        </span>
      </label>
      {error && <p className="mt-3 text-sm text-brand-600">{error}</p>}
    </div>
  );
}
