"use client";
import { useState } from "react";
import {
  calcConsumptionTax,
  SIMPLIFIED_RATES,
  isExemptBusiness,
  type ConsumptionTaxInput,
} from "@/lib/consumption-tax";

interface Props {
  year: number;
}

export function ConsumptionTaxTab({ year }: Props) {
  const [basePeriodSales, setBasePeriodSales] = useState(0);
  const [method, setMethod] = useState<"general" | "simplified">("general");
  const [simplifiedType, setSimplifiedType] = useState(5);

  const [taxableSales10, setTaxableSales10] = useState(0);
  const [taxableSales8, setTaxableSales8] = useState(0);
  const [exportSales, setExportSales] = useState(0);
  const [exemptSales, setExemptSales] = useState(0);
  const [taxablePurchases10, setTaxablePurchases10] = useState(0);
  const [taxablePurchases8, setTaxablePurchases8] = useState(0);

  const isExempt = isExemptBusiness(basePeriodSales);

  const input: ConsumptionTaxInput = {
    taxableSales10,
    taxableSales8,
    exportSales,
    exemptSales,
    taxablePurchases10,
    taxablePurchases8,
    method,
    simplifiedType,
  };

  const result = calcConsumptionTax(input);

  return (
    <div className="space-y-4">
      {/* 免税/課税判定 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">免税/課税事業者の判定</h3>
        <div>
          <label className="block text-xs font-medium text-slate-600 mb-1">
            基準期間（{year - 2}年）の課税売上高
          </label>
          <input type="number" min={0} value={basePeriodSales}
            onChange={e => setBasePeriodSales(Number(e.target.value))}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className={`mt-3 rounded-lg p-3 text-sm font-bold ${isExempt ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
          {isExempt
            ? "免税事業者（課税売上高1,000万円以下）"
            : "課税事業者（消費税の申告・納付が必要です）"}
        </div>
      </div>

      {/* 計算方式の選択 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">計算方式</h3>
        <div className="flex gap-3">
          <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center text-sm font-medium transition-colors ${
            method === "general" ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500"
          }`}>
            <input type="radio" className="hidden" checked={method === "general"}
              onChange={() => setMethod("general")} />
            一般課税（本則課税）
          </label>
          <label className={`flex-1 p-3 rounded-lg border-2 cursor-pointer text-center text-sm font-medium transition-colors ${
            method === "simplified" ? "border-sky-500 bg-sky-50 text-sky-700" : "border-slate-200 text-slate-500"
          }`}>
            <input type="radio" className="hidden" checked={method === "simplified"}
              onChange={() => setMethod("simplified")} />
            簡易課税
          </label>
        </div>
        {method === "simplified" && (
          <div className="mt-3">
            <label className="block text-xs font-medium text-slate-600 mb-1">事業区分</label>
            <select value={simplifiedType} onChange={e => setSimplifiedType(Number(e.target.value))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
              {SIMPLIFIED_RATES.map(r => (
                <option key={r.type} value={r.type}>{r.label}（みなし仕入率{r.rate * 100}%）</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 売上入力 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">売上（税抜）</h3>
        <div className="grid grid-cols-2 gap-3">
          <NumberInput label="10%対象売上" value={taxableSales10} onChange={setTaxableSales10} />
          <NumberInput label="8%対象売上（軽減税率）" value={taxableSales8} onChange={setTaxableSales8} />
          <NumberInput label="輸出免税売上" value={exportSales} onChange={setExportSales} />
          <NumberInput label="非課税売上" value={exemptSales} onChange={setExemptSales} />
        </div>
      </div>

      {/* 仕入入力 */}
      {method === "general" && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
          <h3 className="font-bold text-slate-700 mb-3">仕入（税込）</h3>
          <div className="grid grid-cols-2 gap-3">
            <NumberInput label="10%対象仕入（税込）" value={taxablePurchases10} onChange={setTaxablePurchases10} />
            <NumberInput label="8%対象仕入（税込）" value={taxablePurchases8} onChange={setTaxablePurchases8} />
          </div>
        </div>
      )}

      {/* 計算結果 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">消費税計算結果</h3>
        <div className="space-y-2 text-sm">
          <ResultRow label="売上消費税（10%）" value={result.salesTax10} />
          <ResultRow label="売上消費税（8%）" value={result.salesTax8} />
          <ResultRow label="売上消費税 合計" value={result.totalSalesTax} bold />
          <div className="border-t border-slate-200 my-2" />
          <ResultRow label="仕入税額控除（10%）" value={result.purchaseTax10} />
          <ResultRow label="仕入税額控除（8%）" value={result.purchaseTax8} />
          <ResultRow label="仕入税額控除 合計" value={result.totalPurchaseTax} bold />
          <div className="border-t border-slate-200 my-2" />
          <ResultRow label="消費税額（国税）" value={result.consumptionTax} />
          <ResultRow label="地方消費税額" value={result.localConsumptionTax} />
          <div className="border-t-2 border-slate-300 my-2" />
          <div className="flex justify-between py-2">
            <span className="font-bold text-base">合計納付税額</span>
            <span className="font-bold text-base font-mono text-sky-700">
              {`\u00A5${result.totalTaxPayable.toLocaleString()}`}
            </span>
          </div>
          <div className="text-xs text-slate-400 mt-1">
            課税売上割合: {(result.taxableRatio * 100).toFixed(1)}%
            ｜ 計算方式: {method === "general" ? "一般課税" : "簡易課税"}
          </div>
        </div>
      </div>
    </div>
  );
}

function NumberInput({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div>
      <label className="block text-xs font-medium text-slate-600 mb-1">{label}</label>
      <input type="number" min={0} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
    </div>
  );
}

function ResultRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${bold ? "font-bold" : ""}`}>
      <span className="text-slate-600">{label}</span>
      <span className="font-mono">{`\u00A5${value.toLocaleString()}`}</span>
    </div>
  );
}
