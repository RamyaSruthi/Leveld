import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected routes
  if (!user && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (!user && pathname.startsWith("/curriculum")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (!user && pathname.startsWith("/topic")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (!user && pathname.startsWith("/analytics")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (!user && pathname.startsWith("/settings")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }
  if (!user && pathname.startsWith("/onboarding")) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Redirect authenticated users away from auth page
  if (user && pathname === "/auth") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
