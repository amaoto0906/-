"use server";

import { prisma } from "@/lib/prisma";
import { requireWorkerOrAdmin } from "@/lib/auth-guard";

export async function acknowledgeAlert(id: string) {
  await requireWorkerOrAdmin();
  await prisma.anomalyAlert.update({
    where: { id },
    data: { acknowledgedAt: new Date() },
  });
}
