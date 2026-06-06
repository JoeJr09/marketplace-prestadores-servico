import {
  NextResponse,
  type NextRequest,
} from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
];

const EXACT_PUBLIC_ROUTES = [
  "/prestador",
];

function decodeJwtPayload(
  token: string
) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("JWT inválido");
  }

  const normalizedPayload =
    payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

  return JSON.parse(
    Buffer.from(
      normalizedPayload,
      "base64"
    ).toString("utf-8")
  ) as {
    role?: string;
  };
}

export async function proxy(
  request: NextRequest
) {
  const pathname =
    request.nextUrl.pathname;

  const isPublicRoute =
    EXACT_PUBLIC_ROUTES.includes(
      pathname
    ) ||
    PUBLIC_ROUTES.some((route) =>
      pathname.startsWith(route)
    );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  const token =
    request.cookies.get(
      "sb-access-token"
    )?.value;

  if (!token) {
    return NextResponse.redirect(
      new URL("/login", request.url)
    );
  }

  try {
    const payload =
      decodeJwtPayload(token);

    const userRole =
      payload.role || "client";

    if (
      pathname.startsWith("/admin") &&
      userRole !== "admin"
    ) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    if (
      pathname.startsWith(
        "/prestador"
      ) &&
      pathname !== "/prestador" &&
      !pathname.startsWith("/prestador/")
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
    "/cliente",
    "/cliente/:path*",
    "/prestador/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
