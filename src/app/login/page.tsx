import { imageAssets } from "@/lib/image-assets";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="min-h-screen grid lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] bg-slate-950">
      <section className="relative min-h-[360px] overflow-hidden">
        <picture>
          <source srcSet={imageAssets.heroLogin.webp} type="image/webp" />
          <img
            src={imageAssets.heroLogin.jpg}
            alt={imageAssets.heroLogin.alt}
            className="absolute inset-0 h-full w-full object-cover object-right"
          />
        </picture>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-950/40 to-slate-950/10" />
        <div className="relative z-10 flex min-h-[360px] flex-col justify-end px-6 py-8 text-white sm:px-10 lg:min-h-screen lg:px-14">
          <div className="max-w-xl">
            <div className="mb-5 inline-flex items-center rounded-md border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 backdrop-blur">
              Marine Operations
            </div>
            <h1 className="text-4xl font-bold tracking-normal sm:text-5xl">
              養魚場管理システム
            </h1>
            <p className="mt-4 max-w-md text-sm leading-7 text-slate-200">
              海面養殖の給餌、水質、出荷、異常検知を現場の記録とつないで管理します。
            </p>
          </div>
        </div>
      </section>

      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6">
            <div className="mb-3 h-10 w-10 rounded-lg bg-sky-700 shadow-sm" />
            <h2 className="text-2xl font-bold text-slate-900">ログイン</h2>
            <p className="mt-1 text-sm text-slate-500">
              担当者アカウントで作業を開始してください。
            </p>
          </div>
          <div className="card p-6">
            <LoginForm />
            <p className="mt-6 text-center text-xs text-slate-400">
              デモアカウント: admin@example.com / password
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
