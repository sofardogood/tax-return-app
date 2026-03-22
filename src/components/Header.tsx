"use client";

import { useSession, signOut } from "next-auth/react";
import { useState } from "react";

export function Header() {
  const { data: session } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xl sm:text-2xl">📊</span>
          <div>
            <h1 className="text-base sm:text-xl font-bold text-slate-800">確定申告メモ</h1>
            <p className="text-[10px] sm:text-xs text-slate-500 hidden sm:block">
              収入・経費・領収書を管理して概算税額を確認
            </p>
          </div>
        </div>

        {session?.user && (
          <>
            {/* Desktop */}
            <div className="hidden sm:flex items-center gap-3">
              {session.user.image && (
                <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
              )}
              <span className="text-sm text-slate-600">{session.user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                ログアウト
              </button>
            </div>

            {/* Mobile */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-1.5"
              >
                {session.user.image ? (
                  <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-sky-600 text-sm font-bold">
                    {session.user.email?.[0]?.toUpperCase()}
                  </div>
                )}
              </button>

              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 bg-white border border-slate-200 rounded-xl shadow-lg z-40 w-56 slide-up">
                    <div className="p-3 border-b border-slate-100">
                      <p className="text-sm font-medium text-slate-700 truncate">{session.user.name}</p>
                      <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: "/login" })}
                      className="w-full text-left px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-xl transition-colors"
                    >
                      ログアウト
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
