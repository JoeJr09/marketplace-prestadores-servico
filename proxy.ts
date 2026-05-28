import {
  NextResponse,
  type NextRequest,
} from "next/server";

const PUBLIC_ROUTES = [
  "/login",
  "/register",
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
      userRole !== "professional"
    ) {
      return NextResponse.redirect(
        new URL("/", request.url)
      );
    }

    if (
      pathname.startsWith("/cliente") &&
      userRole !== "client"
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
