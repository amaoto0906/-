"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";

const schema = z.object({
  code: z.string().min(1).max(20),
  nameJa: z.string().min(1).max(50),
  nameSci: z.string().max(100).optional().nullable(),
  optimalTempMin: z.coerce.number().optional().nullable(),
  optimalTempMax: z.coerce.number().optional().nullable(),
  targetFcrMin: z.coerce.number().optional().nullable(),
  targetFcrMax: z.coerce.number().optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

function parseIsActive(f: FormData): boolean {
  const vals = f.getAll("isActive").map(String);
  return vals.includes("true") || vals.includes("on");
}

function fromForm(f: FormData) {
  return schema.parse({
    code: f.get("code"),
    nameJa: f.get("nameJa"),
    nameSci: f.get("nameSci") || null,
    optimalTempMin: f.get("optimalTempMin") || null,
    optimalTempMax: f.get("optimalTempMax") || null,
    targetFcrMin: f.get("targetFcrMin") || null,
    targetFcrMax: f.get("targetFcrMax") || null,
    isActive: parseIsActive(f),
  });
}

export async function createSpecies(formData: FormData) {
  await requireAdmin();
  await prisma.fishSpecies.create({ data: fromForm(formData) });
  revalidatePath("/masters/fish-species");
  redirect("/masters/fish-species");
}

export async function updateSpecies(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.fishSpecies.update({ where: { id }, data: fromForm(formData) });
  revalidatePath("/masters/fish-species");
  redirect("/masters/fish-species");
}

export async function toggleSpeciesActive(id: string) {
  await requireAdmin();
  const cur = await prisma.fishSpecies.findUnique({ where: { id } });
  if (!cur) return;
  await prisma.fishSpecies.update({
    where: { id },
    data: { isActive: !cur.isActive },
  });
  revalidatePath("/masters/fish-species");
}

export async function deleteSpecies(id: string) {
  await requireAdmin();
  await prisma.productionLog.deleteMany({ where: { speciesId: id } });
  await prisma.pondStock.deleteMany({ where: { speciesId: id } });
  await prisma.fishSpecies.delete({ where: { id } });
  revalidatePath("/masters/fish-species");
}
