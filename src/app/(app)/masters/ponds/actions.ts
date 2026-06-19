"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(50),
  type: z.enum(["pond", "tank"]),
  status: z.enum(["active", "paused", "closed"]).default("active"),
  isActive: z.coerce.boolean().default(true),
  volumeM3: z.coerce.number().nonnegative().optional().nullable(),
  areaM2: z.coerce.number().nonnegative().optional().nullable(),
});

function parseIsActive(f: FormData): boolean {
  const vals = f.getAll("isActive").map(String);
  return vals.includes("true") || vals.includes("on");
}

function fromForm(f: FormData) {
  return schema.parse({
    code: f.get("code"),
    name: f.get("name"),
    type: f.get("type"),
    status: f.get("status") ?? "active",
    isActive: parseIsActive(f),
    volumeM3: f.get("volumeM3") || null,
    areaM2: f.get("areaM2") || null,
  });
}

export async function createPond(formData: FormData) {
  await requireAdmin();
  const parsed = fromForm(formData);
  const farm = await prisma.farm.findFirst();
  if (!farm) throw new Error("Farm not found");
  await prisma.pond.create({ data: { ...parsed, farmId: farm.id } });
  revalidatePath("/masters/ponds");
  redirect("/masters/ponds");
}

export async function updatePond(id: string, formData: FormData) {
  await requireAdmin();
  const parsed = fromForm(formData);
  await prisma.pond.update({ where: { id }, data: parsed });
  revalidatePath("/masters/ponds");
  redirect("/masters/ponds");
}

export async function togglePondActive(id: string) {
  await requireAdmin();
  const cur = await prisma.pond.findUnique({ where: { id } });
  if (!cur) return;
  await prisma.pond.update({
    where: { id },
    data: { isActive: !cur.isActive, status: cur.isActive ? "paused" : "active" },
  });
  revalidatePath("/masters/ponds");
}

export async function deletePond(id: string) {
  await requireAdmin();
  await prisma.feedingLog.deleteMany({ where: { pondId: id } });
  await prisma.productionLog.deleteMany({ where: { pondId: id } });
  await prisma.waterQualityLog.deleteMany({ where: { pondId: id } });
  await prisma.dailyAggregate.deleteMany({ where: { pondId: id } });
  await prisma.anomalyAlert.deleteMany({ where: { pondId: id } });
  await prisma.forecastSnapshot.deleteMany({ where: { pondId: id } });
  await prisma.pondStock.deleteMany({ where: { pondId: id } });
  await prisma.pond.delete({ where: { id } });
  revalidatePath("/masters/ponds");
}
