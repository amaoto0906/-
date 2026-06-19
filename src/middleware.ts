import { NextRequest, NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/403"];

/**
 * 認証チェックを cookie ベースの軽量判定で行う。
 *
 * Auth.js v5 beta の `auth()` を middleware で使うと、Server Action の POST 時に
 * セッションが null と判定されアクションが実行されない既知の問題があるため、
 * middleware では cookie の有無だけを見る軽量判定にとどめ、実際のロール検査は
 * 各 Server Action / RSC 内の `requireSession` / `requireAdmin` で行う。
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

  // Server Actions / API POST など GET 以外は通す（各アクション内で認証）
  if (req.method !== "GET" && req.method !== "HEAD") {
    return NextResponse.next();
  }

  // セッショントークン Cookie の存在で簡易判定
  const hasSession =
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token");

  if (!hasSession && !isPublic) {
    return NextResponse.redirect(new URL("/login", req.nextUrl.origin));
  }
  if (hasSession && pathname.startsWith("/login")) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl.origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
