import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

export async function middleware(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  // Libera rotas públicas
  const isPublicRoute =
    PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Pega token JWT do Supabase
  const token =
    request.cookies.get(
      "sb-access-token"
    )?.value;

  // Sem token → login
  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    /**
     * JWT payload
     */
    const payload = JSON.parse(
      Buffer.from(
        token.split(".")[1],
        "base64"
      ).toString()
    );

    /**
     * Role salva no JWT
     *
     * IMPORTANTE:
     * depois vamos pegar do banco
     * mas já deixamos preparado
     */
    const userRole =
      payload.role || "CLIENTE";

    /**
     * admin
     */
    if (
      pathname.startsWith("/admin") &&
      userRole !== "ADMIN"
    ) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    /**
     * prestador
     */
    if (
      pathname.startsWith(
        "/prestador"
      ) &&
      userRole !== "PRESTADOR"
    ) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    /**
     * cliente
     */
    if (
      pathname.startsWith("/cliente") &&
      userRole !== "CLIENTE"
    ) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    return NextResponse.next();

  } catch (error) {
    console.error(error);

    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }
}

export const config = {
  matcher: [
    "/cliente/:path*",
    "/prestador/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};