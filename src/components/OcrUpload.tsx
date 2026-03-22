"use client";
import { useState, useRef } from "react";

interface OcrResult {
  amount: number;
  date: string;
  storeName: string;
}

interface Props {
  year: number;
  onSubmit: (entry: any) => Promise<void>;
}

export function OcrUpload({ year, onSubmit }: Props) {
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [ocrResult, setOcrResult] = useState<OcrResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setOcrResult(null);
    setError("");
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = ev => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  }

  async function handleOcr() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("画像ファイルを選択してください");
      return;
    }
    setScanning(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/ocr", { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data: OcrResult = await res.json();
      setOcrResult(data);
    } catch {
      setError("OCR読み取りに失敗しました");
    } finally {
      setScanning(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const entry = {
      id: crypto.randomUUID(),
      date: fd.get("date") as string,
      year: new Date(fd.get("date") as string).getFullYear(),
      amount: Number(fd.get("amount")),
      storeName: fd.get("storeName") as string,
      note: fd.get("note") as string,
      category: fd.get("category") as string,
    };
    try {
      await onSubmit(entry);
      e.currentTarget.reset();
      setPreview(null);
      setOcrResult(null);
    } catch {
      setError("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-bold text-slate-700 mb-3">レシートOCR読み取り</h3>
      {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* ドロップゾーン */}
        <div
          className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-sky-400 hover:bg-sky-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="max-h-40 mx-auto rounded-lg" />
          ) : (
            <div>
              <p className="text-3xl mb-2">📷</p>
              <p className="text-sm text-slate-500">レシート画像をアップロード</p>
              <p className="text-xs text-slate-400 mt-1">JPG, PNG対応</p>
            </div>
          )}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>

        {/* OCRボタン */}
        <button type="button" onClick={handleOcr} disabled={scanning || !preview}
          className="w-full bg-violet-500 hover:bg-violet-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {scanning ? "読み取り中..." : "OCRで読み取り"}
        </button>

        {/* OCR結果プレビュー */}
        {ocrResult && (
          <div className="bg-violet-50 rounded-lg p-3 text-sm">
            <p className="font-bold text-violet-700 mb-1">読み取り結果:</p>
            <p className="text-slate-600">店名: {ocrResult.storeName || "（不明）"}</p>
            <p className="text-slate-600">金額: {`\u00A5${ocrResult.amount.toLocaleString()}`}</p>
            <p className="text-slate-600">日付: {ocrResult.date || "（不明）"}</p>
          </div>
        )}

        {/* フォーム */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">日付</label>
            <input name="date" type="date" required
              defaultValue={ocrResult?.date || new Date().toISOString().split("T")[0]}
              key={ocrResult?.date || "default-date"}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">金額（円）</label>
            <input name="amount" type="number" min={0} required
              defaultValue={ocrResult?.amount || ""}
              key={ocrResult?.amount || "default-amount"}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">店名</label>
            <input name="storeName"
              defaultValue={ocrResult?.storeName || ""}
              key={ocrResult?.storeName || "default-store"}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">区分</label>
            <select name="category" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              <option value="消耗品費">消耗品費</option>
              <option value="旅費交通費">旅費交通費</option>
              <option value="通信費">通信費</option>
              <option value="接待交際費">接待交際費</option>
              <option value="地代家賃">地代家賃</option>
              <option value="水道光熱費">水道光熱費</option>
              <option value="雑費">雑費</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">メモ</label>
          <input name="note" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button type="submit" disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
          {saving ? "保存中..." : "経費として登録"}
        </button>
      </form>
    </div>
  );
}
