"use client";

interface Props {
  result: ReturnType<typeof import("@/lib/tax-engine").estimateTax>;
  year: number;
}

export function Dashboard({ result, year }: Props) {
  const balance = result.balance;
  return (
    <div>
      <h2 className="text-lg font-bold text-slate-700 mb-3">📊 {year}年 ダッシュボード</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KPI label="💰 総収入" value={result.totalIncome} sub={`${result.incomeCount}件`} />
        <KPI label="💳 総経費" value={result.totalExpenses} sub={`${result.expenseCount}件`} />
        <KPI label="🏦 源泉徴収済" value={result.withheld} />
        <KPI label="📋 概算税額" value={result.totalTax} />
        <KPI
          label={balance > 0 ? "💸 追加納付" : "🎉 還付見込"}
          value={Math.abs(balance)}
          color={balance > 0 ? "red" : "green"}
          sub={balance > 0 ? "要納付" : "還付予定"}
        />
      </div>
    </div>
  );
}

function KPI({ label, value, sub, color }: {
  label: string; value: number; sub?: string; color?: "red" | "green";
}) {
  const colorClass = color === "red" ? "border-l-red-500" : color === "green" ? "border-l-emerald-500" : "border-l-sky-500";
  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border border-slate-200 border-l-4 ${colorClass}`}>
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className="text-xl font-bold text-slate-800">¥{value.toLocaleString()}</div>
      {sub && <div className="text-xs text-slate-400 mt-1">{sub}</div>}
    </div>
  );
}
