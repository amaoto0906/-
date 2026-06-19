"use server";

import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth-guard";

const schema = z.object({
  code: z.string().min(1).max(20),
  name: z.string().min(1).max(50),
  manufacturer: z.string().max(50).optional().nullable(),
  unit: z.enum(["kg", "L", "袋"]).default("kg"),
  proteinPct: z.coerce.number().min(0).max(100).optional().nullable(),
  fatPct: z.coerce.number().min(0).max(100).optional().nullable(),
  unitPrice: z.coerce.number().min(0).optional().nullable(),
  isActive: z.coerce.boolean().default(true),
});

function parseIsActive(f: FormData): boolean {
  const vals = f.getAll("isActive").map(String);
  return vals.includes("true") || vals.includes("on");
}

function fromForm(f: FormData) {
  return schema.parse({
    code: f.get("code"),
    name: f.get("name"),
    manufacturer: f.get("manufacturer") || null,
    unit: f.get("unit") || "kg",
    proteinPct: f.get("proteinPct") || null,
    fatPct: f.get("fatPct") || null,
    unitPrice: f.get("unitPrice") || null,
    isActive: parseIsActive(f),
  });
}

export async function createFeed(formData: FormData) {
  await requireAdmin();
  await prisma.feed.create({ data: fromForm(formData) });
  revalidatePath("/masters/feeds");
  redirect("/masters/feeds");
}

export async function updateFeed(id: string, formData: FormData) {
  await requireAdmin();
  await prisma.feed.update({ where: { id }, data: fromForm(formData) });
  revalidatePath("/masters/feeds");
  redirect("/masters/feeds");
}

export async function toggleFeedActive(id: string) {
  await requireAdmin();
  const cur = await prisma.feed.findUnique({ where: { id } });
  if (!cur) return;
  await prisma.feed.update({
    where: { id },
    data: { isActive: !cur.isActive },
  });
  revalidatePath("/masters/feeds");
}

export async function deleteFeed(id: string) {
  await requireAdmin();
  await prisma.feedingLog.deleteMany({ where: { feedId: id } });
  await prisma.feed.delete({ where: { id } });
  revalidatePath("/masters/feeds");
}
