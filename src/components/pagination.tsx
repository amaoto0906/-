import Link from "next/link";

export function Pagination({
  page,
  perPage,
  total,
  searchParams,
  basePath,
}: {
  page: number;
  perPage: number;
  total: number;
  searchParams: Record<string, string | undefined>;
  basePath: string;
}) {
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  if (totalPages <= 1) {
    return (
      <div className="mt-4 text-sm text-slate-500 text-center">
        全 {total.toLocaleString()} 件
      </div>
    );
  }

  const from = (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, total);

  const buildUrl = (p: number) => {
    const params = new URLSearchParams();
    for (const [k, v] of Object.entries(searchParams)) {
      if (v && k !== "page") params.set(k, v);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  };

  const pageNumbers: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pageNumbers.push(i);

  return (
    <div className="mt-4 flex items-center justify-between text-sm">
      <div className="text-slate-500">
        全 {total.toLocaleString()} 件中 {from.toLocaleString()} 〜 {to.toLocaleString()} 件
      </div>
      <div className="flex items-center gap-1">
        {page > 1 && (
          <Link href={buildUrl(page - 1)} className="btn-secondary text-xs py-1 px-2">
            ← 前へ
          </Link>
        )}
        {pageNumbers.map((n) => (
          <Link
            key={n}
            href={buildUrl(n)}
            className={
              n === page
                ? "btn-primary text-xs py-1 px-3"
                : "btn-secondary text-xs py-1 px-3"
            }
          >
            {n}
          </Link>
        ))}
        {page < totalPages && (
          <Link href={buildUrl(page + 1)} className="btn-secondary text-xs py-1 px-2">
            次へ →
          </Link>
        )}
      </div>
    </div>
  );
}
