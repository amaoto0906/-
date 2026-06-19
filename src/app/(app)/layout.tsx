import { auth, signOut } from "@/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  AlertTriangle,
  ClipboardList,
  Database,
  Droplets,
  FileText,
  Fish,
  LayoutDashboard,
  LineChart,
  LogOut,
  Package,
  Settings,
  Tags,
  Waves,
  type LucideIcon,
} from "lucide-react";

const navSections: Array<{
  title: string;
  items: Array<{ href: string; label: string; icon: LucideIcon }>;
}> = [
  {
    title: "メイン",
    items: [
      { href: "/dashboard", label: "ダッシュボード", icon: LayoutDashboard },
      { href: "/anomalies", label: "アラート", icon: AlertTriangle },
    ],
  },
  {
    title: "日次入力",
    items: [
      { href: "/feeding/new", label: "給餌入力", icon: Package },
      { href: "/production/new", label: "生産入力", icon: Fish },
      { href: "/water-quality/new", label: "水質入力", icon: Droplets },
    ],
  },
  {
    title: "履歴・帳票",
    items: [
      { href: "/feeding", label: "給餌履歴", icon: ClipboardList },
      { href: "/production", label: "生産履歴", icon: LineChart },
      { href: "/reports", label: "帳票", icon: FileText },
    ],
  },
  {
    title: "AI / 分析",
    items: [{ href: "/forecast", label: "予測", icon: LineChart }],
  },
  {
    title: "マスタ管理",
    items: [
      { href: "/masters/ponds", label: "池・水槽", icon: Waves },
      { href: "/masters/fish-species", label: "魚種", icon: Tags },
      { href: "/masters/feeds", label: "飼料", icon: Database },
    ],
  },
  {
    title: "設定",
    items: [{ href: "/settings", label: "アカウント設定", icon: Settings }],
  },
];

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
      <aside className="relative z-20 flex w-full flex-col overflow-hidden border-r border-slate-800/100 bg-slate-950 text-slate-200 shadow-2xl lg:sticky lg:top-0 lg:h-screen lg:w-72">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_20%_0%,rgba(14,165,233,0.24),transparent_32%),radial-gradient(circle_at_80%_18%,rgba(45,212,191,0.16),transparent_30%)]" />
        <div className="relative px-5 py-5">
          <Link href="/dashboard" className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-white/5">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500 to-teal-400 text-white shadow-lg shadow-sky-950/40">
              <Fish className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <div className="font-bold tracking-normal text-white">養魚場管理</div>
              <div className="text-xs text-slate-400">Marine Farm System</div>
            </div>
          </Link>
        </div>
        <nav className="relative flex-1 overflow-y-auto px-3 pb-4">
          {navSections.map((section) => (
            <div key={section.title} className="mb-5">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-normal text-slate-500">
                {section.title}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex min-h-10 items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-300 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white/10 hover:text-white hover:shadow-lg hover:shadow-slate-950/20"
                    >
                      <span className="flex h-8 w-8 items-center justify-center rounded-md bg-white/5 text-slate-400 ring-1 ring-white/10 transition-colors group-hover:bg-sky-400/15 group-hover:text-sky-200 group-hover:ring-sky-300/20">
                        <Icon className="h-4 w-4" aria-hidden="true" />
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="relative border-t border-white/10 px-5 py-4">
          <div className="rounded-lg bg-white/5 p-3 ring-1 ring-white/10">
            <div className="text-sm font-semibold text-white">{session.user?.name}</div>
            <div className="mt-1 break-all text-xs leading-5 text-slate-400">
              {session.user?.email} ({(session.user as { role?: string })?.role})
            </div>
            <form
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/login" });
              }}
              className="mt-3"
            >
              <button
                type="submit"
                className="inline-flex items-center gap-2 text-xs font-medium text-slate-400 transition-colors hover:text-white"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                ログアウト
              </button>
            </form>
          </div>
        </div>
      </aside>
      <main className="min-w-0 flex-1 overflow-x-auto">{children}</main>
    </div>
  );
}
