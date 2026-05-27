import { NextResponse, type NextRequest } from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get(
      "sb-access-token"
    )?.value;

    if (!token) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        {
          status: 401,
        }
      );
    }

    const decoded =
      verifyAccessToken(token);

    return NextResponse.json({
      user: decoded,
    });
  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      {
        status: 401,
      }
    );
  }
}
