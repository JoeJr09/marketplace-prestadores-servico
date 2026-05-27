import { NextResponse } from "next/server";

import { supabase } from "@/lib/supabase";

import {
  generateAccessToken,
  generateRefreshToken,
} from "@/lib/jwt";

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    const {
      email,
      password,
    } = body;

    /**
     * login supabase
     */
    const {
      data,
      error,
    } =
      await supabase.auth.signInWithPassword(
        {
          email,
          password,
        }
      );

    if (
      error ||
      !data.user
    ) {
      return NextResponse.json(
        {
          error:
            "Email ou senha inválidos",
        },
        {
          status: 401,
        }
      );
    }

    /**
     * busca profile
     */
    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (
      profileError ||
      !profile
    ) {
      return NextResponse.json(
        {
          error:
            "Perfil não encontrado",
        },
        {
          status: 404,
        }
      );
    }

    /**
     * payload JWT
     */
    const payload = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    };

    /**
     * gera tokens
     */
    const accessToken =
      generateAccessToken(
        payload
      );

    const refreshToken =
      generateRefreshToken(
        payload
      );

    /**
     * response
     */
    const response =
      NextResponse.json({
        message:
          "Login realizado",
        user: profile,
      });

    /**
     * cookies
     */
    response.cookies.set(
      "sb-access-token",
      accessToken,
      {
        httpOnly: true,
        secure:
          process.env
            .NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 15,
      }
    );

    response.cookies.set(
      "sb-refresh-token",
      refreshToken,
      {
        httpOnly: true,
        secure:
          process.env
            .NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge:
          60 *
          60 *
          24 *
          7,
      }
    );

    return response;

  } catch (err) {
    console.error(err);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      {
        status: 500,
      }
    );
  }
}