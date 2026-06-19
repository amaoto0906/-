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
  speciesId: z.string().min(1, "魚種を選択してください"),
  recordedAt: z.string().min(1, "日付を入力してください"),
  harvestedCount: z.coerce.number().int().nonnegative().max(1000000).default(0),
  harvestedWeightKg: z.coerce.number().nonnegative().max(1000000).default(0),
  mortalityCount: z.coerce.number().int().nonnegative().max(1000000).default(0),
  avgWeightG: z.coerce.number().nonnegative().max(100000).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

function fromForm(f: FormData) {
  return schema.parse({
    pondId: f.get("pondId"),
    speciesId: f.get("speciesId"),
    recordedAt: f.get("recordedAt"),
    harvestedCount: f.get("harvestedCount"),
    harvestedWeightKg: f.get("harvestedWeightKg"),
    mortalityCount: f.get("mortalityCount"),
    avgWeightG: f.get("avgWeightG") || null,
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

export async function createProductionLog(formData: FormData) {
  await requireWorkerOrAdmin();
  const session = await auth();
  const userId = (session?.user as { id?: string })?.id;
  const parsed = fromForm(formData);
  const date = parseLocalDate(parsed.recordedAt);
  await prisma.productionLog.create({
    data: { ...parsed, recordedAt: date, recordedUserId: userId },
  });
  await recalcAfterChange(parsed.pondId, date);
  revalidatePath("/production");
  revalidatePath("/dashboard");
  revalidatePath("/anomalies");
  redirect("/production");
}

export async function updateProductionLog(id: string, formData: FormData) {
  await requireWorkerOrAdmin();
  const parsed = fromForm(formData);
  const date = parseLocalDate(parsed.recordedAt);
  const old = await prisma.productionLog.findUnique({ where: { id } });
  if (!old) throw new Error("Record not found");
  await prisma.productionLog.update({
    where: { id },
    data: { ...parsed, recordedAt: date },
  });
  await recalcAfterChange(parsed.pondId, date);
  if (old.pondId !== parsed.pondId) {
    await recalcAfterChange(old.pondId, old.recordedAt);
  }
  revalidatePath("/production");
  revalidatePath("/dashboard");
  redirect("/production");
}

export async function deleteProductionLog(id: string) {
  await requireWorkerOrAdmin();
  const old = await prisma.productionLog.findUnique({ where: { id } });
  if (!old) return;
  await prisma.productionLog.delete({ where: { id } });
  await recalcAfterChange(old.pondId, old.recordedAt);
  revalidatePath("/production");
  revalidatePath("/dashboard");
}
