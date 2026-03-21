"use client";

export function TabNav({ tabs, active, onChange }: {
  tabs: string[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
      {tabs.map((label, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
            active === i
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
