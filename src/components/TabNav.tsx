"use client";

import { useState } from "react";

interface TabDef {
  label: string;
  shortLabel: string;
  icon: string;
}

const TAB_DEFS: TabDef[] = [
  { label: "収入・経費", shortLabel: "収支", icon: "💰" },
  { label: "領収書・OCR", shortLabel: "領収書", icon: "📄" },
  { label: "帳簿・仕訳", shortLabel: "帳簿", icon: "📒" },
  { label: "減価償却", shortLabel: "償却", icon: "🏗️" },
  { label: "消費税", shortLabel: "消費税", icon: "🧾" },
  { label: "概算計算", shortLabel: "計算", icon: "🧮" },
  { label: "申告書PDF", shortLabel: "PDF", icon: "📋" },
  { label: "レポート", shortLabel: "集計", icon: "📊" },
  { label: "ヘルプ", shortLabel: "ヘルプ", icon: "❓" },
];

export function TabNav({ tabs, active, onChange }: {
  tabs: string[]; active: number; onChange: (i: number) => void;
}) {
  const [moreOpen, setMoreOpen] = useState(false);

  // Mobile: show first 4 tabs + "more" button in bottom nav
  const MOBILE_VISIBLE = 4;
  const visibleTabs = TAB_DEFS.slice(0, MOBILE_VISIBLE);
  const hiddenTabs = TAB_DEFS.slice(MOBILE_VISIBLE);

  return (
    <>
      {/* === Desktop/Tablet: horizontal tab bar === */}
      <div className="hidden md:flex gap-1 bg-slate-100 rounded-xl p-1 overflow-x-auto tab-scroll">
        {tabs.map((label, i) => {
          const def = TAB_DEFS[i];
          return (
            <button
              key={i}
              onClick={() => onChange(i)}
              className={`flex-shrink-0 flex items-center gap-1.5 py-2.5 px-4 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                active === i
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span>{def?.icon}</span>
              <span className="hidden lg:inline">{label}</span>
              <span className="lg:hidden">{def?.shortLabel || label}</span>
            </button>
          );
        })}
      </div>

      {/* === Mobile: bottom navigation bar === */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
           style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="flex justify-around items-center h-16">
          {visibleTabs.map((def, i) => (
            <button
              key={i}
              onClick={() => { onChange(i); setMoreOpen(false); }}
              className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
                active === i && !moreOpen
                  ? "text-sky-500 bottom-nav-active"
                  : "text-slate-400"
              }`}
            >
              <span className="text-xl">{def.icon}</span>
              <span className="text-[10px] font-medium">{def.shortLabel}</span>
            </button>
          ))}
          {/* More button */}
          <button
            onClick={() => setMoreOpen(!moreOpen)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-0.5 transition-colors ${
              moreOpen || active >= MOBILE_VISIBLE
                ? "text-sky-500 bottom-nav-active"
                : "text-slate-400"
            }`}
          >
            <span className="text-xl">•••</span>
            <span className="text-[10px] font-medium">その他</span>
          </button>
        </div>

        {/* More menu overlay */}
        {moreOpen && (
          <>
            <div
              className="fixed inset-0 bg-black/20 z-40"
              onClick={() => setMoreOpen(false)}
            />
            <div className="absolute bottom-full left-0 right-0 bg-white border-t border-slate-200 z-50 slide-up shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
              <div className="grid grid-cols-5 gap-1 p-3">
                {hiddenTabs.map((def, idx) => {
                  const i = idx + MOBILE_VISIBLE;
                  return (
                    <button
                      key={i}
                      onClick={() => { onChange(i); setMoreOpen(false); }}
                      className={`flex flex-col items-center gap-1 py-3 px-1 rounded-xl transition-colors ${
                        active === i
                          ? "bg-sky-50 text-sky-600"
                          : "text-slate-500 hover:bg-slate-50"
                      }`}
                    >
                      <span className="text-2xl">{def.icon}</span>
                      <span className="text-xs font-medium">{def.shortLabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
}
