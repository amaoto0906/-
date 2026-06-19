import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { renderPeriodReportPDF } from "@/lib/pdf-report";
import { generateWeeklyComment, isoWeekRange } from "@/lib/services/ai-comment";
import { getBySpecies, getByPondDetail } from "@/lib/services/aggregation";
import { toDateKey } from "@/lib/utils";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const week = req.nextUrl.searchParams.get("week");
  if (!week || !/^\d{4}-W\d{2}$/.test(week)) {
    return NextResponse.json({ error: "invalid week (expected YYYY-Www)" }, { status: 400 });
  }

  const { from, to } = isoWeekRange(week);
  const [comment, bySpecies, byPond] = await Promise.all([
    generateWeeklyComment(week),
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
    title: "養魚場 週次報告書",
    periodKey: week,
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
      "Content-Disposition": `attachment; filename="weekly-report-${week}.pdf"`,
    },
  });
}
