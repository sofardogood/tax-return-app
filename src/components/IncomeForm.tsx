"use client";

import { useState } from "react";
import type { IncomeEntry, IncomeCategory } from "@/lib/tax-engine";

const CATEGORIES: { label: string; value: IncomeCategory }[] = [
  { label: "業務委託（事業所得）", value: "business" },
  { label: "給与/アルバイト", value: "salary" },
  { label: "配当所得", value: "dividend" },
  { label: "不動産所得", value: "real_estate" },
  { label: "退職所得", value: "retirement" },
  { label: "譲渡所得", value: "capital_gains" },
  { label: "一時所得", value: "occasional" },
  { label: "雑所得", value: "miscellaneous" },
  { label: "その他", value: "other" },
];

const TAX_TYPES = [
  { label: "課税10%", value: "taxable_10" },
  { label: "課税8%（軽減）", value: "taxable_8" },
  { label: "非課税", value: "exempt" },
  { label: "免税", value: "tax_free" },
  { label: "輸出免税", value: "export_exempt" },
];

export function IncomeForm({ year, onSubmit }: { year: number; onSubmit: (e: IncomeEntry) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [needsApportionment, setNeedsApportionment] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const entry: IncomeEntry = {
      id: crypto.randomUUID(),
      date: fd.get("date") as string,
      year: new Date(fd.get("date") as string).getFullYear(),
      amount: Number(fd.get("amount")),
      category: fd.get("category") as IncomeCategory,
      source: fd.get("source") as string,
      withheld: Number(fd.get("withheld")),
      note: fd.get("note") as string,
      yearsOfService: fd.get("yearsOfService") ? Number(fd.get("yearsOfService")) : undefined,
    };
    try {
      await onSubmit(entry);
      e.currentTarget.reset();
      setNeedsApportionment(false);
    } catch {
      alert("保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
      <h3 className="font-bold text-slate-700 mb-3">💰 収入登録</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Input name="date" label="日付" type="date" defaultValue={today} required />
          <Input name="amount" label="支払総額（円）" type="number" min={0} required />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">区分</label>
            <select name="category" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </div>
          <Input name="withheld" label="源泉徴収額" type="number" min={0} defaultValue="0" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">消費税区分</label>
            <select name="taxType" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {TAX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div className="flex items-end gap-2">
            <div className="flex items-center gap-2 pb-2">
              <input
                type="checkbox"
                id="needsApportionment"
                checked={needsApportionment}
                onChange={e => setNeedsApportionment(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-sky-500 focus:ring-sky-300"
              />
              <label htmlFor="needsApportionment" className="text-xs font-medium text-slate-600">家事按分あり</label>
            </div>
          </div>
        </div>
        {needsApportionment && (
          <Input name="apportionmentRatio" label="事業使用割合（%）" type="number" min={0} max={100} defaultValue="100" />
        )}
        <Input name="source" label="支払者・案件名" />
        <Input name="note" label="メモ" />
        <button
          type="submit"
          disabled={saving}
          className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? "保存中..." : "➕ 収入を追加"}
        </button>
      </form>
    </div>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input {...rest} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-sky-300 focus:border-sky-400 outline-none" />
    </div>
  );
}
