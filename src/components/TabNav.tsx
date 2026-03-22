"use client";

const SHORT_LABELS: Record<string, string> = {
  "収入": "収入",
  "経費": "経費",
  "領収書": "領収書",
  "概算税額": "税額",
  "源泉徴収": "源泉",
};

export function TabNav({ tabs, active, onChange }: {
  tabs: string[]; active: number; onChange: (i: number) => void;
}) {
  return (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto tab-scroll">
      {tabs.map((label, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`flex-shrink-0 flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
            active === i
              ? "bg-white text-slate-900 shadow-sm"
              : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
          }`}
        >
          <span className="hidden sm:inline">{label}</span>
          <span className="sm:hidden">{SHORT_LABELS[label] || label}</span>
        </button>
      ))}
    </div>
  );
}
