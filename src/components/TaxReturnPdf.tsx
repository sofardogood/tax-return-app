"use client";
import { useState, useEffect } from "react";

interface TaxpayerInfo {
  name: string;
  address: string;
  myNumber: string;
  occupation: string;
  birthDate: string;
  phone: string;
  email: string;
}

interface Props {
  year: number;
  result: any;
  data: any;
}

const EMPTY_TAXPAYER: TaxpayerInfo = {
  name: "", address: "", myNumber: "", occupation: "",
  birthDate: "", phone: "", email: "",
};

export function TaxReturnPdf({ year, result, data }: Props) {
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [info, setInfo] = useState<TaxpayerInfo>(EMPTY_TAXPAYER);

  // Load existing taxpayer info
  useEffect(() => {
    const existing = data?.taxpayerInfo?.find((t: any) => t.year === year);
    if (existing) {
      setInfo({
        name: existing.name || "",
        address: existing.address || "",
        myNumber: existing.myNumber || "",
        occupation: existing.occupation || "",
        birthDate: existing.birthDate || "",
        phone: existing.phone || "",
        email: existing.email || "",
      });
    }
  }, [data, year]);

  async function handleSaveInfo() {
    setSaving(true);
    setSaved(false);
    setError("");
    try {
      const entry = {
        id: crypto.randomUUID(),
        ...info,
        year,
      };
      const res = await fetch("/api/sheets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "taxpayer", entry }),
      });
      if (!res.ok) throw new Error();
      setSaved(true);
    } catch {
      setError("申告者情報の保存に失敗しました");
    } finally {
      setSaving(false);
    }
  }

  async function handleDownload(type: "tax-return" | "blue-form") {
    setDownloading(true);
    setError("");
    try {
      const url = `/api/pdf?year=${year}&type=${type}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = type === "tax-return"
        ? `確定申告書_${year}.pdf`
        : `青色申告決算書_${year}.pdf`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch {
      setError("PDFのダウンロードに失敗しました");
    } finally {
      setDownloading(false);
    }
  }

  const set = (key: keyof TaxpayerInfo, value: string) => {
    setInfo(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const incomes = (data?.incomes || []).filter((i: any) => i.year === year);
  const expenses = (data?.expenses || []).filter((e: any) => e.year === year);
  const totalIncome = incomes.reduce((s: number, i: any) => s + (i.amount || 0), 0);
  const totalExpense = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);
  const totalWithheld = incomes.reduce((s: number, i: any) => s + (i.withheld || 0), 0);

  return (
    <div className="space-y-4">
      {/* 申告者情報入力 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">申告者情報</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">氏名</label>
              <input value={info.name} onChange={e => set("name", e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">職業</label>
              <input value={info.occupation} onChange={e => set("occupation", e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">住所</label>
            <input value={info.address} onChange={e => set("address", e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">マイナンバー</label>
              <input value={info.myNumber} onChange={e => set("myNumber", e.target.value)}
                type="password" maxLength={12}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">生年月日</label>
              <input value={info.birthDate} onChange={e => set("birthDate", e.target.value)}
                type="date"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">電話番号</label>
              <input value={info.phone} onChange={e => set("phone", e.target.value)}
                type="tel"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">メールアドレス</label>
            <input value={info.email} onChange={e => set("email", e.target.value)}
              type="email"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
          </div>
          <button onClick={handleSaveInfo} disabled={saving}
            className="w-full bg-slate-600 hover:bg-slate-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50">
            {saving ? "保存中..." : saved ? "保存済み" : "申告者情報を保存"}
          </button>
        </div>
      </div>

      {/* プレビュー */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <h3 className="font-bold text-slate-700 mb-3">{year}年分 申告書プレビュー</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">総収入金額</span>
            <span className="font-mono font-bold">{`\u00A5${totalIncome.toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">必要経費</span>
            <span className="font-mono">{`\u00A5${totalExpense.toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">所得金額</span>
            <span className="font-mono font-bold">{`\u00A5${(totalIncome - totalExpense).toLocaleString()}`}</span>
          </div>
          <div className="flex justify-between py-1 border-b border-slate-100">
            <span className="text-slate-600">源泉徴収済税額</span>
            <span className="font-mono">{`\u00A5${totalWithheld.toLocaleString()}`}</span>
          </div>
          {result && (
            <>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">所得控除合計</span>
                <span className="font-mono">{`\u00A5${(result.deductions?.total || 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">所得税額</span>
                <span className="font-mono">{`\u00A5${(result.incomeTax || 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">復興特別所得税</span>
                <span className="font-mono">{`\u00A5${(result.reconstructionTax || 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">住民税（概算）</span>
                <span className="font-mono">{`\u00A5${(result.residentTax || 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100">
                <span className="text-slate-600">税額合計</span>
                <span className="font-mono font-bold">{`\u00A5${(result.totalTax || 0).toLocaleString()}`}</span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-300">
                <span className="font-bold">{result.balance > 0 ? "納付額" : "還付額"}</span>
                <span className={`font-bold font-mono text-lg ${result.balance > 0 ? "text-red-600" : "text-emerald-600"}`}>
                  {`\u00A5${Math.abs(result.balance || 0).toLocaleString()}`}
                </span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ダウンロードボタン */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => handleDownload("tax-return")} disabled={downloading}
            className="bg-sky-500 hover:bg-sky-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50">
            {downloading ? "生成中..." : "確定申告書 PDF"}
          </button>
          <button onClick={() => handleDownload("blue-form")} disabled={downloading}
            className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50">
            {downloading ? "生成中..." : "青色申告決算書 PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}
