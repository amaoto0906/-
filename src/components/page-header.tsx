import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: { href: string; label: string };
}) {
  const actionLabel = action?.label.replace(/^\+\s*/, "");
  const ActionIcon = action?.label.trim().startsWith("+") ? Plus : ArrowRight;

  return (
    <div className="page-header-shell px-8 py-6">
      <div className="min-w-0">
        <div className="mb-2 h-1 w-12 rounded-full bg-gradient-to-r from-sky-500 to-teal-400" />
        <h1 className="text-2xl font-bold tracking-normal text-slate-900">
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action && actionLabel && (
        <Link href={action.href} className="btn-primary gap-2 whitespace-nowrap">
          <ActionIcon className="h-4 w-4" aria-hidden="true" />
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
