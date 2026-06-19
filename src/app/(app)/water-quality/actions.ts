"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireWorkerOrAdmin } from "@/lib/auth-guard";
import { parseLocalDate } from "@/lib/utils";

const schema = z.object({
  pondId: z.string().min(1, "池・水槽を選択してください"),
  recordedAt: z.string().min(1, "日付を入力してください"),
  tempC: z.coerce.number().min(-5).max(50).optional().nullable(),
  ph: z.coerce.number().min(0).max(14).optional().nullable(),
  doMgL: z.coerce.number().min(0).max(50).optional().nullable(),
  note: z.string().max(500).optional().nullable(),
});

export async function createWaterQualityLog(formData: FormData) {
  await requireWorkerOrAdmin();
  const parsed = schema.parse({
    pondId: formData.get("pondId"),
    recordedAt: formData.get("recordedAt"),
    tempC: formData.get("tempC") || null,
    ph: formData.get("ph") || null,
    doMgL: formData.get("doMgL") || null,
    note: formData.get("note") || null,
  });
  await prisma.waterQualityLog.create({
    data: {
      pondId: parsed.pondId,
      recordedAt: parseLocalDate(parsed.recordedAt),
      tempC: parsed.tempC,
      ph: parsed.ph,
      doMgL: parsed.doMgL,
      note: parsed.note,
      source: "manual",
    },
  });
  redirect("/dashboard");
}
