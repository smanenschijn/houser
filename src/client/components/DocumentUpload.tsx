import { useRef, useState } from "react";
import type { DocumentAnalysis, DocumentSectionType } from "@/lib/types";

interface DocumentUploadProps {
  houseId: string;
  type: DocumentSectionType;
  label: string;
  onUploaded: (documentAnalysis: DocumentAnalysis) => void;
}

export default function DocumentUpload({
  houseId,
  type,
  label,
  onUploaded,
}: DocumentUploadProps) {
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
      const res = await fetch(`/api/houses/${houseId}/documents/${type}`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Uploaden mislukt");
      }

      onUploaded(data.documentAnalysis as DocumentAnalysis);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Uploaden mislukt");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="mt-3">
      <label
        className={`inline-flex cursor-pointer items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-1.5 text-xs font-medium text-brand-700 transition-colors hover:border-brand-400 hover:bg-brand-50 ${
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
        {uploading ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 5v14m-7-7h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        )}
        {uploading ? "Uploaden…" : label}
      </label>
      {error && <p className="mt-2 text-xs text-brand-600">{error}</p>}
    </div>
  );
}
