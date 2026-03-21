"use client";

import { useState, useEffect, useCallback } from "react";
import type { TaxData, IncomeEntry, ExpenseEntry, ReceiptEntry } from "@/lib/tax-engine";
import { estimateTax, type EstimateParams } from "@/lib/tax-engine";
import { Dashboard } from "@/components/Dashboard";
import { IncomeForm } from "@/components/IncomeForm";
import { ExpenseForm } from "@/components/ExpenseForm";
import { ReceiptUpload } from "@/components/ReceiptUpload";
import { EstimatePanel } from "@/components/EstimatePanel";
import { DataTable } from "@/components/DataTable";
import { TabNav } from "@/components/TabNav";

const BLANK_DATA: TaxData = { incomes: [], expenses: [], withholding_slips: [], receipts: [] };

const DEFAULT_PARAMS: EstimateParams = {
  year: new Date().getFullYear(),
  socialInsurance: 0, blueDeduction: 0, extraExpenses: 0,
  basicDeduction: 480_000, residentBasicDeduction: 430_000,
  residentRate: 0.10, residentPerCapita: 5_000,
  medicalTotal: 0, medicalReimbursement: 0, furusatoDonations: 0,
  lifeInsGeneral: 0, lifeInsMedical: 0, lifeInsPension: 0,
  earthquakeInsurance: 0, spouseIncome: -1, dependentAges: [], ideco: 0,
};

export default function Home() {
  const [data, setData] = useState<TaxData>(BLANK_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState(0);
  const [year, setYear] = useState(new Date().getFullYear());
  const [params, setParams] = useState<EstimateParams>({ ...DEFAULT_PARAMS });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/sheets");
      if (!res.ok) throw new Error(await res.text());
      const d = await res.json();
      if (d.error) throw new Error(d.error);
      setData(d);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "データの読み込みに失敗しました");
      setData(BLANK_DATA);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setParams(p => ({ ...p, year })); }, [year]);

  const result = estimateTax(params, data);

  const addEntry = async (type: string, entry: IncomeEntry | ExpenseEntry | ReceiptEntry) => {
    const res = await fetch("/api/sheets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, entry }),
    });
    if (!res.ok) throw new Error("保存に失敗しました");
    await fetchData();
  };

  const deleteEntry = async (sheet: string, id: string) => {
    const res = await fetch(`/api/sheets?sheet=${sheet}&id=${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error("削除に失敗しました");
    await fetchData();
  };

  const years = Array.from(new Set([
    year,
    ...data.incomes.map(i => i.year),
    ...data.expenses.map(e => e.year),
  ])).sort((a, b) => b - a);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
          <p className="font-medium">⚠️ Google Sheets未接続</p>
          <p className="text-sm mt-1">環境変数の設定後にデータが表示されます。現在はデモモードです。</p>
          <p className="text-xs mt-1 text-amber-600">{error}</p>
        </div>
      )}

      {/* Year selector */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-slate-600">対象年:</label>
        <select
          value={year}
          onChange={e => setYear(Number(e.target.value))}
          className="border border-slate-300 rounded-lg px-3 py-1.5 text-sm bg-white"
        >
          {years.map(y => <option key={y} value={y}>{y}年</option>)}
        </select>
      </div>

      {/* Dashboard KPIs */}
      <Dashboard result={result} year={year} />

      {/* Tabs */}
      <TabNav
        tabs={["📝 収入・経費", "🧾 領収書・書類", "🧮 概算計算", "📊 レポート"]}
        active={tab}
        onChange={setTab}
      />

      {/* Tab content */}
      {tab === 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <IncomeForm year={year} onSubmit={entry => addEntry("income", entry)} />
            <ExpenseForm year={year} onSubmit={entry => addEntry("expense", entry)} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <DataTable
              title="収入一覧"
              items={data.incomes.filter(i => i.year === year) as any[]}
              columns={[
                { key: "date", label: "日付" },
                { key: "category", label: "区分" },
                { key: "amount", label: "金額", format: (v: number) => `¥${v.toLocaleString()}` },
                { key: "source", label: "支払者" },
                { key: "withheld", label: "源泉", format: (v: number) => `¥${v.toLocaleString()}` },
              ]}
              onDelete={id => deleteEntry("incomes", id)}
            />
            <DataTable
              title="経費一覧"
              items={data.expenses.filter(e => e.year === year) as any[]}
              columns={[
                { key: "date", label: "日付" },
                { key: "category", label: "区分" },
                { key: "amount", label: "金額", format: (v: number) => `¥${v.toLocaleString()}` },
                { key: "note", label: "メモ" },
              ]}
              onDelete={id => deleteEntry("expenses", id)}
            />
          </div>
        </div>
      )}

      {tab === 1 && (
        <div className="space-y-6">
          <ReceiptUpload year={year} onSubmit={entry => addEntry("receipt", entry)} />
          <DataTable
            title="領収書・書類一覧"
            items={data.receipts.filter(r => r.year === year) as any[]}
            columns={[
              { key: "date", label: "日付" },
              { key: "category", label: "区分" },
              { key: "amount", label: "金額", format: (v: number) => `¥${v.toLocaleString()}` },
              { key: "fileName", label: "ファイル名" },
              { key: "note", label: "メモ" },
            ]}
            onDelete={id => deleteEntry("receipts", id)}
          />
        </div>
      )}

      {tab === 2 && (
        <EstimatePanel params={params} setParams={setParams} result={result} />
      )}

      {tab === 3 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-bold mb-4">📊 {year}年 年次レポート</h2>
          {result.incomeCount === 0 && result.expenseCount === 0 ? (
            <p className="text-slate-500">データがありません。収入・経費を登録してください。</p>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat label="総収入" value={result.totalIncome} />
                <Stat label="総経費" value={result.totalExpenses} />
                <Stat label="概算税額" value={result.totalTax} />
                <Stat label="実効税率" value={`${(result.effectiveRate * 100).toFixed(1)}%`} raw />
              </div>
              <div>
                <h3 className="font-semibold text-sm text-slate-600 mb-2">所得内訳</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    ["給与", result.salary], ["事業", result.business], ["配当", result.dividend],
                    ["不動産", result.realEstate], ["譲渡", result.capitalGains],
                    ["一時", result.occasional], ["雑", result.miscellaneous], ["その他", result.other],
                  ].filter(([, v]) => (v as number) > 0).map(([label, val]) => (
                    <div key={label as string} className="bg-slate-50 rounded-lg p-2 text-center">
                      <div className="text-xs text-slate-500">{label as string}</div>
                      <div className="font-semibold">¥{(val as number).toLocaleString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, raw }: { label: string; value: number | string; raw?: boolean }) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 text-center">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-lg font-bold text-slate-800">
        {raw ? value : `¥${(value as number).toLocaleString()}`}
      </div>
    </div>
  );
}
