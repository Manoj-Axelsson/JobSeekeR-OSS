"use client";

import { useState } from "react";

interface DocumentUploaderProps {
  onUploadSuccess?: () => void;
}

export function DocumentUploader({ onUploadSuccess }: DocumentUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<"CV" | "CERTIFICATE" | "COVER_LETTER">("CV");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [extractedSkills, setExtractedSkills] = useState<string[]>([]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", fileType);

    try {
      const res = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Upload failed");
      }

      setMessage({ type: "success", text: `Successfully parsed ${data.document.filename}!` });
      setExtractedSkills(data.document.extractedSkills || []);
      setFile(null);

      if (onUploadSuccess) onUploadSuccess();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "Failed to upload document" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-9 h-9 rounded-lg bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold text-lg">
          📄
        </div>
        <div>
          <h3 className="text-lg font-bold text-slate-100">Upload CV & Certificates</h3>
          <p className="text-xs text-slate-400">PDF or Text documents for skill extraction & AI match enhancement</p>
        </div>
      </div>

      <form onSubmit={handleUpload} className="space-y-4">
        <div className="flex gap-3">
          <label className="flex-1 cursor-pointer">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Document Type
            </span>
            <select
              value={fileType}
              onChange={(e) => setFileType(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="CV">Curriculum Vitae (CV / Resume)</option>
              <option value="CERTIFICATE">Educational / Competence Certificate</option>
              <option value="COVER_LETTER">Cover Letter / Pitch</option>
            </select>
          </label>
        </div>

        <div>
          <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Choose File (.pdf, .txt, .docx)
          </span>
          <input
            type="file"
            accept=".pdf,.txt,.doc,.docx"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
          />
        </div>

        <button
          type="submit"
          disabled={!file || uploading}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-indigo-600/20"
        >
          {uploading ? "Parsing Document..." : "Upload & Extract Competences"}
        </button>
      </form>

      {message && (
        <div
          className={`mt-4 p-3 rounded-xl text-xs font-medium ${
            message.type === "success"
              ? "bg-emerald-950/60 border border-emerald-500/30 text-emerald-300"
              : "bg-red-950/60 border border-red-500/30 text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      {extractedSkills.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-800">
          <span className="text-xs font-semibold text-slate-400 block mb-2">
            Extracted Competences ({extractedSkills.length}):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {extractedSkills.map((skill, idx) => (
              <span
                key={idx}
                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-950/80 border border-indigo-500/30 text-indigo-300"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
