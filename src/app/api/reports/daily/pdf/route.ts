import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { renderDailyReportPDF } from "@/lib/pdf-report";
import { generateDailyComment } from "@/lib/services/ai-comment";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const date = req.nextUrl.searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "invalid date" }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00`);
  const dayEnd = new Date(`${date}T23:59:59`);

  const [aggregates, ponds, feedingLogs, productionLogs, comment] =
    await Promise.all([
      prisma.dailyAggregate.findMany({
        where: { date },
        include: { pond: true },
      }),
      prisma.pond.findMany({ orderBy: { code: "asc" } }),
      prisma.feedingLog.findMany({
        where: { recordedAt: { gte: dayStart, lte: dayEnd } },
        include: { pond: true, feed: true },
        orderBy: { recordedAt: "asc" },
      }),
      prisma.productionLog.findMany({
        where: { recordedAt: { gte: dayStart, lte: dayEnd } },
        include: { pond: true, species: true },
        orderBy: { recordedAt: "asc" },
      }),
      generateDailyComment(date),
    ]);

  // 全池表示（データなしも）
  const aggMap = new Map(aggregates.map((a) => [a.pondId, a]));
  const aggArr = ponds.map((p) => {
    const a = aggMap.get(p.id);
    return {
      pondId: p.id,
      pondName: p.name,
      pondCode: p.code,
      feed: a?.totalFeedKg ?? 0,
      production: a?.totalProductionKg ?? 0,
      mortality: a?.totalMortalityCount ?? 0,
      fcr: a?.fcr ?? null,
    };
  });

  const totals = {
    feed: aggArr.reduce((s, a) => s + a.feed, 0),
    production: aggArr.reduce((s, a) => s + a.production, 0),
    mortality: aggArr.reduce((s, a) => s + a.mortality, 0),
  };

  const pdfBuffer = await renderDailyReportPDF({
    date,
    aggregates: aggArr,
    totals,
    feedingLogs: feedingLogs.map((l) => ({
      pondName: l.pond.name,
      feedName: l.feed.name,
      amountKg: l.amountKg,
    })),
    productionLogs: productionLogs.map((l) => ({
      pondName: l.pond.name,
      speciesName: l.species.nameJa,
      harvestedCount: l.harvestedCount,
      harvestedWeightKg: l.harvestedWeightKg,
      mortalityCount: l.mortalityCount,
    })),
    aiComment: comment,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="daily-report-${date}.pdf"`,
    },
  });
}
