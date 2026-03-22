import type { Metadata, Viewport } from "next";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/lib/auth";
import { Header } from "@/components/Header";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0ea5e9",
};

export const metadata: Metadata = {
  title: "確定申告メモ",
  description: "収入・経費・領収書を管理して概算税額を確認",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "確定申告メモ",
  },
  manifest: "/manifest.json",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  return (
    <html lang="ja">
      <body className="bg-slate-50 text-slate-900 min-h-screen">
        <SessionProvider session={session}>
          <Header />
          <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
          <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200">
            ⚠ 本ツールは概算です。最終判断は税務署・税理士にご相談ください。
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
