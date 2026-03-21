"use client";

import { useState, useRef } from "react";
import type { ReceiptEntry } from "@/lib/tax-engine";

const RECEIPT_CATS = [
  "領収書", "支払調書", "源泉徴収票", "控除証明書（生命保険）",
  "控除証明書（社会保険）", "控除証明書（ふるさと納税）",
  "請求書", "契約書", "その他",
];

export function ReceiptUpload({ year, onSubmit }: { year: number; onSubmit: (e: ReceiptEntry) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData(e.currentTarget);
    const file = fd.get("file") as File;

    try {
      let fileId = "";
      let fileName = file?.name || "no-file";
      let thumbnailUrl = "";

      // Upload to Google Drive
      if (file && file.size > 0) {
        const uploadFd = new FormData();
        uploadFd.append("file", file);
        const uploadRes = await fetch("/api/drive", { method: "POST", body: uploadFd });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          fileId = uploadData.fileId || "";
          fileName = uploadData.fileName || file.name;
          thumbnailUrl = uploadData.thumbnailUrl || "";
        }
      }

      const entry: ReceiptEntry = {
        id: crypto.randomUUID(),
        date: fd.get("date") as string,
        year: new Date(fd.get("date") as string).getFullYear(),
        fileName,
        fileId,
        thumbnailUrl,
        category: fd.get("category") as string,
        amount: Number(fd.get("amount")) || 0,
        note: fd.get("note") as string,
      };

      await onSubmit(entry);
      e.currentTarget.reset();
      setPreview(null);
    } catch {
      alert("アップロードに失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-bold text-slate-700 mb-3">📷 領収書・書類アップロード</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Drop zone */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
          ) : (
            <div>
              <p className="text-3xl mb-2">📎</p>
              <p className="text-sm text-slate-500">クリックまたはドラッグ&ドロップ</p>
              <p className="text-xs text-slate-400 mt-1">画像・PDF対応（最大10MB）</p>
            </div>
          )}
          <input
            ref={fileRef}
            name="file"
            type="file"
            accept="image/*,.pdf"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">日付</label>
            <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">金額（円）</label>
            <input name="amount" type="number" min={0} defaultValue={0}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">書類の種類</label>
          <select name="category" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {RECEIPT_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">メモ</label>
          <input name="note" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "アップロード中..." : "📤 アップロード"}
        </button>
      </form>
    </div>
  );
}
