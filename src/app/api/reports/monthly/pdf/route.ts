import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { renderPeriodReportPDF } from "@/lib/pdf-report";
import { generateMonthlyComment, monthRange } from "@/lib/services/ai-comment";
import { getBySpecies, getByPondDetail } from "@/lib/services/aggregation";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const month = req.nextUrl.searchParams.get("month");
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return NextResponse.json({ error: "invalid month (expected YYYY-MM)" }, { status: 400 });
  }

  const { from, to } = monthRange(month);
  const [comment, bySpecies, byPond] = await Promise.all([
    generateMonthlyComment(month),
    getBySpecies(from, to),
    getByPondDetail(from, to),
  ]);

  const totals = byPond.reduce(
    (acc, p) => ({
      feed: acc.feed + p.feed,
      production: acc.production + p.production,
      mortality: acc.mortality + p.mortality,
    }),
    { feed: 0, production: 0, mortality: 0 },
  );

  const pdf = await renderPeriodReportPDF({
    title: "養魚場 月次報告書",
    periodKey: month,
    rangeLabel: `${toDateKey(from)} 〜 ${toDateKey(to)}`,
    totals,
    aggregates: byPond.map((p) => ({
      pondCode: p.code,
      pondName: p.name,
      feed: p.feed,
      production: p.production,
      mortality: p.mortality,
      fcr: p.fcr,
    })),
    bySpecies: bySpecies.map((s) => ({
      name: s.nameJa,
      count: s.count,
      production: s.production,
      mortality: s.mortality,
    })),
    aiComment: comment,
  });

  return new NextResponse(new Uint8Array(pdf), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="monthly-report-${month}.pdf"`,
    },
  });
}
