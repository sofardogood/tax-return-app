"use client";

import { useSession, signOut } from "next-auth/react";

export function Header() {
  const { data: session } = useSession();

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📊</span>
          <div>
            <h1 className="text-xl font-bold text-slate-800">確定申告メモ</h1>
            <p className="text-xs text-slate-500">収入・経費・領収書を管理して概算税額を確認</p>
          </div>
        </div>
        {session?.user && (
          <div className="flex items-center gap-3">
            {session.user.image && (
              <img
                src={session.user.image}
                alt=""
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-sm text-slate-600 hidden sm:inline">
              {session.user.email}
            </span>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              ログアウト
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
