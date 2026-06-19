"use server";

import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { requireSession } from "@/lib/auth-guard";

const schema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(6, "新しいパスワードは6文字以上必要です"),
    confirmPassword: z.string().min(1),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "新しいパスワードと確認用が一致しません",
    path: ["confirmPassword"],
  });

type State = { error: string | null; success: string | null };

export async function changePasswordAction(
  _prev: State,
  formData: FormData,
): Promise<State> {
  const user = await requireSession();
  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "入力に誤りがあります",
      success: null,
    };
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    return { error: "ユーザーが見つかりません", success: null };
  }

  const ok = await bcrypt.compare(parsed.data.currentPassword, dbUser.password);
  if (!ok) {
    return { error: "現在のパスワードが正しくありません", success: null };
  }

  const hashed = await bcrypt.hash(parsed.data.newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed, passwordChangedAt: new Date() },
  });

  return { error: null, success: "✅ パスワードを変更しました" };
}
