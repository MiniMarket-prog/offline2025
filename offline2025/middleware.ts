import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // If no session and trying to access protected routes, redirect to login
  if (!session && !req.nextUrl.pathname.startsWith("/")) {
    return NextResponse.redirect(new URL("/", req.url))
  }

  // If session exists and trying to access login page, redirect to dashboard
  if (session && req.nextUrl.pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return res
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
