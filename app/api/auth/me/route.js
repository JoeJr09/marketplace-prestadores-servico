import { NextResponse } from "next/server";

import {
  verifyAccessToken,
} from "@/lib/jwt";

export async function GET(
  req: Request
) {
  try {
    const cookie =
      req.headers.get("cookie");

    const token =
      cookie
        ?.split("; ")
        .find((c) =>
          c.startsWith(
            "sb-access-token="
          )
        )
        ?.split("=")[1];

    if (!token) {
      return NextResponse.json(
        {
          error:
            "Não autenticado",
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