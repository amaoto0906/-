"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { auth } from "@/auth";
import { recalcDailyAggregates } from "@/lib/services/aggregation";
import { runAnomalyDetection } from "@/lib/services/anomaly";

import { requireWorkerOrAdmin } from "@/lib/auth-guard";
import { parseLocalDate } from "@/lib/utils";

const schema = z.object({
  pondId: z.string().min(1, "池・水槽を選択してください"),
  feedId: z.string().min(1, "飼料を選択してください"),
  recordedAt: z.string().min(1, "日付を入力してください"),
  amountKg: z.coerce.number().positive("給餌量は0より大きい値を入力してください").max(10000, "給餌量が大きすぎます"),
  mealsCount: z.coerce.number().int().min(1).max(20).default(1),
  note: z.string().max(500).optional().nullable(),
});

function fromForm(f: FormData) {
  return schema.parse({
    pondId: f.get("pondId"),
    feedId: f.get("feedId"),
    recordedAt: f.get("recordedAt"),
    amountKg: f.get("amountKg"),
    mealsCount: f.get("mealsCount") ?? 1,
    note: f.get("note") || null,
  });
}

async function recalcAfterChange(pondId: string, date: Date) {
  const from = new Date(date);
  from.setDate(from.getDate() - 1);
  const to = new Date(date);
  to.setDate(to.getDate() + 1);
  await recalcDailyAggregates(pondId, from, to);
  await runAnomalyDetection();
}

export async function createFeedingLog(formData: FormData) {
  await requireWorkerOrAdmin();
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const parsed = fromForm(formData);
  const date = parseLocalDate(parsed.recordedAt);
  await prisma.feedingLog.create({
    data: { ...parsed, recordedAt: date, feederUserId: userId },
  });
  await recalcAfterChange(parsed.pondId, date);
  revalidatePath("/feeding");
  revalidatePath("/dashboard");
  revalidatePath("/anomalies");
  redirect("/feeding");
}

export async function updateFeedingLog(id: string, formData: FormData) {
  await requireWorkerOrAdmin();
  const parsed = fromForm(formData);
  const date = parseLocalDate(parsed.recordedAt);
  const old = await prisma.feedingLog.findUnique({ where: { id } });
  if (!old) throw new Error("Record not found");
  await prisma.feedingLog.update({
    where: { id },
    data: { ...parsed, recordedAt: date },
  });
  // 旧データの池と新データの池の集計を両方再計算
  await recalcAfterChange(parsed.pondId, date);
  if (old.pondId !== parsed.pondId) {
    await recalcAfterChange(old.pondId, old.recordedAt);
  }
  revalidatePath("/feeding");
  revalidatePath("/dashboard");
  redirect("/feeding");
}

export async function deleteFeedingLog(id: string) {
  await requireWorkerOrAdmin();
  const old = await prisma.feedingLog.findUnique({ where: { id } });
  if (!old) return;
  await prisma.feedingLog.delete({ where: { id } });
  await recalcAfterChange(old.pondId, old.recordedAt);
  revalidatePath("/feeding");
  revalidatePath("/dashboard");
}
