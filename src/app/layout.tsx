import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "養魚場管理システム",
  description: "養魚場の日次業務を自動化する管理システム",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja">
      <body className="min-h-screen bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
