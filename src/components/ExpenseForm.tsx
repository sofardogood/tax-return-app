"use client";

import { useState } from "react";
import type { ExpenseEntry } from "@/lib/tax-engine";

const EXPENSE_CATS = [
  "通信費", "旅費交通費", "消耗品費", "接待交際費", "広告宣伝費",
  "地代家賃", "水道光熱費", "外注工賃", "租税公課", "雑費", "その他",
];

const TAX_TYPES = [
  { label: "課税10%", value: "taxable_10" },
  { label: "課税8%（軽減）", value: "taxable_8" },
  { label: "非課税", value: "exempt" },
  { label: "免税", value: "tax_free" },
];

export function ExpenseForm({ year, onSubmit }: { year: number; onSubmit: (e: ExpenseEntry) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [isTaxIncluded, setIsTaxIncluded] = useState(true);
  const [amount, setAmount] = useState(0);
  const [taxType, setTaxType] = useState("taxable_10");
  const [apportionmentRatio, setApportionmentRatio] = useState(100);
  const today = new Date().toISOString().split("T")[0];

  const taxRate = taxType === "taxable_10" ? 0.10 : taxType === "taxable_8" ? 0.08 : 0;
  const baseAmount = isTaxIncluded && taxRate > 0
    ? Math.round(amount / (1 + taxRate))
    : amount;
  const afterApportionment = Math.round(baseAmount * apportionmentRatio / 100);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const entry: ExpenseEntry = {
      id: crypto.randomUUID(),
      date: fd.get("date") as string,
      year: new Date(fd.get("date") as string).getFullYear(),
      amount: afterApportionment,
      category: fd.get("category") as string,
      note: fd.get("note") as string,
    };
    try {
      await onSubmit(entry);
      e.currentTarget.reset();
      setAmount(0);
      setApportionmentRatio(100);
      setTaxType("taxable_10");
      setIsTaxIncluded(true);
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
            <input
              name="amount"
              type="number"
              min={0}
              required
              value={amount || ""}
              onChange={e => setAmount(Number(e.target.value) || 0)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">区分</label>
            <select name="category" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {EXPENSE_CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">消費税区分</label>
            <select
              name="taxType"
              value={taxType}
              onChange={e => setTaxType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {TAX_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="taxIncluded"
                checked={isTaxIncluded}
                onChange={() => setIsTaxIncluded(true)}
                className="w-3.5 h-3.5 text-sky-500"
              />
              税込
            </label>
            <label className="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer">
              <input
                type="radio"
                name="taxIncluded"
                checked={!isTaxIncluded}
                onChange={() => setIsTaxIncluded(false)}
                className="w-3.5 h-3.5 text-sky-500"
              />
              税抜
            </label>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">家事按分割合（%）</label>
            <input
              type="number"
              min={0}
              max={100}
              value={apportionmentRatio}
              onChange={e => setApportionmentRatio(Number(e.target.value) || 0)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        </div>
        {amount > 0 && (
          <div className="text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-2">
            按分後の経費額: <span className="font-semibold text-slate-700">¥{afterApportionment.toLocaleString()}</span>
            {isTaxIncluded && taxRate > 0 && (
              <span className="ml-2">（税抜: ¥{baseAmount.toLocaleString()}）</span>
            )}
          </div>
        )}
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
