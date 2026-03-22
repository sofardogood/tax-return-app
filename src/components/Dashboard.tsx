"use client";

interface Props {
  result: ReturnType<typeof import("@/lib/tax-engine").estimateTax>;
  year: number;
}

export function Dashboard({ result, year }: Props) {
  const balance = result.balance;
  return (
    <div>
      <h2 className="text-base sm:text-lg font-bold text-slate-700 mb-3">
        📊 {year}年 ダッシュボード
      </h2>
      {/* Mobile: 2col, Tablet: 3col, Desktop: 5col */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <KPI label="総収入" icon="💰" value={result.totalIncome} sub={`${result.incomeCount}件`} />
        <KPI label="総経費" icon="💳" value={result.totalExpenses} sub={`${result.expenseCount}件`} />
        <KPI label="源泉徴収済" icon="🏦" value={result.withheld} />
        <KPI label="概算税額" icon="📋" value={result.totalTax} />
        <KPI
          label={balance > 0 ? "追加納付" : "還付見込"}
          icon={balance > 0 ? "💸" : "🎉"}
          value={Math.abs(balance)}
          color={balance > 0 ? "red" : "green"}
          sub={balance > 0 ? "要納付" : "還付予定"}
          className="col-span-2 sm:col-span-1"
        />
      </div>
    </div>
  );
}

function KPI({ label, icon, value, sub, color, className }: {
  label: string; icon: string; value: number; sub?: string;
  color?: "red" | "green"; className?: string;
}) {
  const colorClass = color === "red"
    ? "border-l-red-500"
    : color === "green"
    ? "border-l-emerald-500"
    : "border-l-sky-500";

  return (
    <div className={`bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-slate-200 border-l-4 ${colorClass} ${className || ""}`}>
      <div className="flex items-center gap-1 mb-0.5">
        <span className="text-sm">{icon}</span>
        <span className="text-[10px] sm:text-xs text-slate-500">{label}</span>
      </div>
      <div className="text-base sm:text-xl font-bold text-slate-800 truncate">
        ¥{value.toLocaleString()}
      </div>
      {sub && <div className="text-[10px] sm:text-xs text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}
