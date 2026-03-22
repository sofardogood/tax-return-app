"use client";
import { useState } from "react";
import {
  DEFAULT_ACCOUNTS,
  generateTrialBalance,
  generateBS,
  generatePL,
  type JournalEntry,
  type Account,
} from "@/lib/bookkeeping";

type SubTab = "journal" | "trial" | "bs" | "pl";

interface Props {
  year: number;
  data: any;
  onRefresh: () => void;
}

export function BookkeepingTab({ year, data, onRefresh }: Props) {
  const [subTab, setSubTab] = useState<SubTab>("journal");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const entries: JournalEntry[] = data?.journal || [];
  const accounts: Account[] = DEFAULT_ACCOUNTS;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const fd = new FormData(e.currentTarget);
    const debitCode = fd.get("debitCode") as string;
    const creditCode = fd.get("creditCode") as string;
    const debitAcc = accounts.find(a => a.code === debitCode);
    const creditAcc = accounts.find(a => a.code === creditCode);
    const amount = Number(fd.get("amount"));
    const taxRate = Number(fd.get("taxRate"));

    const entry: JournalEntry = {
      id: crypto.randomUUID(),
      date: fd.get("date") as string,
      year: new Date(fd.get("date") as string).getFullYear(),
      debitCode,
      debitName: debitAcc?.name || "",
      creditCode,
      creditName: creditAcc?.name || "",
      amount,
      description: fd.get("description") as string,
      taxRate,
      taxAmount: taxRate > 0 ? Math.floor(amount * taxRate / (100 + taxRate)) : 0,
    };

    try {
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "journal", data: entry }),
      });
      if (!res.ok) throw new Error();
      e.currentTarget.reset();
      onRefresh();
    } catch {
      setError("仕訳の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  const subTabs: { key: SubTab; label: string }[] = [
    { key: "journal", label: "仕訳帳" },
    { key: "trial", label: "試算表" },
    { key: "bs", label: "貸借対照表" },
    { key: "pl", label: "損益計算書" },
  ];

  return (
    <div className="space-y-4">
      {/* 仕訳入力フォーム */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">仕訳入力</h3>
        {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">日付</label>
              <input name="date" type="date" defaultValue={new Date().toISOString().split("T")[0]} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">金額（円）</label>
              <input name="amount" type="number" min={0} required
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">借方科目</label>
              <select name="debitCode" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {accounts.map(a => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">貸方科目</label>
              <select name="creditCode" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                {accounts.map(a => <option key={a.code} value={a.code}>{a.code} {a.name}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">摘要</label>
              <input name="description" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">消費税率</label>
              <select name="taxRate" className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm">
                <option value="0">なし（0%）</option>
                <option value="8">軽減税率（8%）</option>
                <option value="10">標準税率（10%）</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-sky-500 hover:bg-sky-600 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "保存中..." : "仕訳を追加"}
          </button>
        </form>
      </div>

      {/* サブタブ */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex gap-1 mb-4 border-b border-slate-200 pb-2">
          {subTabs.map(t => (
            <button key={t.key} onClick={() => setSubTab(t.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                subTab === t.key ? "bg-sky-500 text-white" : "text-slate-600 hover:bg-slate-100"
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {subTab === "journal" && <JournalTable entries={entries} />}
        {subTab === "trial" && <TrialBalanceTable entries={entries} accounts={accounts} />}
        {subTab === "bs" && <BSTable entries={entries} accounts={accounts} />}
        {subTab === "pl" && <PLTable entries={entries} accounts={accounts} />}
      </div>
    </div>
  );
}

function JournalTable({ entries }: { entries: JournalEntry[] }) {
  if (entries.length === 0) return <p className="text-sm text-slate-400">仕訳データがありません</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 px-2">日付</th>
            <th className="py-2 px-2">借方</th>
            <th className="py-2 px-2">貸方</th>
            <th className="py-2 px-2 text-right">金額</th>
            <th className="py-2 px-2">摘要</th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => (
            <tr key={e.id} className="border-b border-slate-100">
              <td className="py-2 px-2 text-slate-600">{e.date}</td>
              <td className="py-2 px-2">{e.debitName}</td>
              <td className="py-2 px-2">{e.creditName}</td>
              <td className="py-2 px-2 text-right font-mono">{`\u00A5${e.amount.toLocaleString()}`}</td>
              <td className="py-2 px-2 text-slate-500">{e.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TrialBalanceTable({ entries, accounts }: { entries: JournalEntry[]; accounts: Account[] }) {
  const rows = generateTrialBalance(entries, accounts);
  if (rows.length === 0) return <p className="text-sm text-slate-400">データがありません</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
            <th className="py-2 px-2">コード</th>
            <th className="py-2 px-2">勘定科目</th>
            <th className="py-2 px-2 text-right">借方合計</th>
            <th className="py-2 px-2 text-right">貸方合計</th>
            <th className="py-2 px-2 text-right">残高</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.code} className="border-b border-slate-100">
              <td className="py-2 px-2 text-slate-400 font-mono">{r.code}</td>
              <td className="py-2 px-2">{r.name}</td>
              <td className="py-2 px-2 text-right font-mono">{`\u00A5${r.debitTotal.toLocaleString()}`}</td>
              <td className="py-2 px-2 text-right font-mono">{`\u00A5${r.creditTotal.toLocaleString()}`}</td>
              <td className="py-2 px-2 text-right font-mono font-bold">{`\u00A5${r.balance.toLocaleString()}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BSTable({ entries, accounts }: { entries: JournalEntry[]; accounts: Account[] }) {
  const bs = generateBS(entries, accounts);
  if (entries.length === 0) return <p className="text-sm text-slate-400">データがありません</p>;
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <h4 className="font-bold text-slate-600 mb-2 text-sm">資産の部</h4>
        {bs.assets.map((a, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100">
            <span>{a.name}</span>
            <span className="font-mono">{`\u00A5${a.amount.toLocaleString()}`}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 font-bold border-t-2 border-slate-300 mt-1">
          <span>資産合計</span>
          <span className="font-mono">{`\u00A5${bs.totalAssets.toLocaleString()}`}</span>
        </div>
      </div>
      <div>
        <h4 className="font-bold text-slate-600 mb-2 text-sm">負債・純資産の部</h4>
        {bs.liabilities.map((a, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100">
            <span>{a.name}</span>
            <span className="font-mono">{`\u00A5${a.amount.toLocaleString()}`}</span>
          </div>
        ))}
        {bs.equity.map((a, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100">
            <span>{a.name}</span>
            <span className="font-mono">{`\u00A5${a.amount.toLocaleString()}`}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-1 border-b border-slate-100">
          <span>当期純利益</span>
          <span className="font-mono">{`\u00A5${bs.netIncome.toLocaleString()}`}</span>
        </div>
        <div className="flex justify-between text-sm py-2 font-bold border-t-2 border-slate-300 mt-1">
          <span>負債・純資産合計</span>
          <span className="font-mono">{`\u00A5${(bs.totalLiabilities + bs.totalEquity).toLocaleString()}`}</span>
        </div>
      </div>
    </div>
  );
}

function PLTable({ entries, accounts }: { entries: JournalEntry[]; accounts: Account[] }) {
  const pl = generatePL(entries, accounts);
  if (entries.length === 0) return <p className="text-sm text-slate-400">データがありません</p>;
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-bold text-slate-600 mb-2 text-sm">収益</h4>
        {pl.revenue.map((r, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100">
            <span>{r.name}</span>
            <span className="font-mono">{`\u00A5${r.amount.toLocaleString()}`}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 font-bold border-t-2 border-slate-300 mt-1">
          <span>収益合計</span>
          <span className="font-mono">{`\u00A5${pl.totalRevenue.toLocaleString()}`}</span>
        </div>
      </div>
      <div>
        <h4 className="font-bold text-slate-600 mb-2 text-sm">費用</h4>
        {pl.expenses.map((r, i) => (
          <div key={i} className="flex justify-between text-sm py-1 border-b border-slate-100">
            <span>{r.name}</span>
            <span className="font-mono">{`\u00A5${r.amount.toLocaleString()}`}</span>
          </div>
        ))}
        <div className="flex justify-between text-sm py-2 font-bold border-t-2 border-slate-300 mt-1">
          <span>費用合計</span>
          <span className="font-mono">{`\u00A5${pl.totalExpenses.toLocaleString()}`}</span>
        </div>
      </div>
      <div className="bg-slate-50 rounded-lg p-3">
        <div className="flex justify-between font-bold text-lg">
          <span>当期純利益</span>
          <span className={`font-mono ${pl.netIncome >= 0 ? "text-emerald-600" : "text-red-600"}`}>
            {`\u00A5${pl.netIncome.toLocaleString()}`}
          </span>
        </div>
      </div>
    </div>
  );
}
