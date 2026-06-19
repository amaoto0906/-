import { formatNumber } from "@/lib/utils";
import { Activity, AlertTriangle, BarChart3, Fish, Package } from "lucide-react";

const iconMap = {
  "🍚": Package,
  "🐟": Fish,
  "⚠️": AlertTriangle,
  "📊": BarChart3,
} as const;

export function KpiCard({
  label,
  value,
  unit,
  change,
  icon,
}: {
  label: string;
  value: number | null;
  unit: string;
  change?: number | null;
  icon?: string;
}) {
  const changeColor =
    change == null
      ? "text-slate-400"
      : change >= 0
        ? "text-emerald-600"
        : "text-red-600";
  const Icon = icon ? iconMap[icon as keyof typeof iconMap] ?? Activity : null;

  return (
    <div className="card group relative overflow-hidden p-5 animate-fade-in-up">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-sky-500 via-teal-400 to-emerald-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-xs font-semibold uppercase tracking-normal text-slate-500">
            {label}
          </div>
          <div className="mt-2 text-2xl font-bold tracking-normal text-slate-900">
            {formatNumber(value)}
            <span className="ml-1 text-sm font-normal text-slate-500">{unit}</span>
          </div>
        </div>
        {Icon && (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-700 ring-1 ring-sky-100 transition-transform duration-300 group-hover:-translate-y-0.5">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {change !== undefined && (
        <div className={`mt-3 inline-flex rounded-md bg-slate-50 px-2 py-1 text-xs font-medium ${changeColor}`}>
          {change == null
            ? "前月比 -"
            : `前月比 ${change >= 0 ? "+" : ""}${change.toFixed(1)}%`}
        </div>
      )}
    </div>
  );
}
