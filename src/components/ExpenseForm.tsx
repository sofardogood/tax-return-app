"use client";

import { useState } from "react";
import type { ExpenseEntry } from "@/lib/tax-engine";

const EXPENSE_CATS = [
  "通信費", "旅費交通費", "消耗品費", "接待交際費", "広告宣伝費",
  "地代家賃", "水道光熱費", "外注工賃", "租税公課", "雑費", "その他",
];

export function ExpenseForm({ year, onSubmit }: { year: number; onSubmit: (e: ExpenseEntry) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const entry: ExpenseEntry = {
      id: crypto.randomUUID(),
      date: fd.get("date") as string,
      year: new Date(fd.get("date") as string).getFullYear(),
      amount: Number(fd.get("amount")),
      category: fd.get("category") as string,
      note: fd.get("note") as string,
    };
    try {
      await onSubmit(entry);
      e.currentTarget.reset();
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-bold text-slate-700 mb-3">💳 経費登録</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">日付</label>
            <input name="date" type="date" defaultValue={today} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">金額（円）</label>
            <input name="amount" type="number" min={0} required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">区分</label>
          <select name="category" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
            {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">メモ</label>
          <input name="note" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "➕ 経費を追加"}
        </button>
      </form>
    </div>
  );
}
