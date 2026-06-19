"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function loginAction(_prev: { error: string | null }, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
    return { error: null };
  } catch (e) {
    if (e instanceof AuthError) {
      return { error: "メールアドレスまたはパスワードが正しくありません" };
    }
    throw e;
  }
}
