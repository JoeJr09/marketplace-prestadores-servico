import { NextResponse, type NextRequest } from "next/server";

import {
  generateAccessToken,
  generateRefreshToken,
} from "@/app/lib/jwt";

interface LoginRequestBody {
  email?: string;
  password?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body =
      (await req.json()) as LoginRequestBody;

    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          error:
            "Email e senha são obrigatórios",
        },
        {
          status: 400,
        }
      );
    }

    const { supabase } =
      await import("@/app/lib/supabase");

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.user) {
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

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
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

    const payload = {
      id: profile.id,
      email: profile.email,
      role: profile.role,
    };

    const accessToken =
      generateAccessToken(payload);

    const refreshToken =
      generateRefreshToken(payload);

    const response =
      NextResponse.json({
        message: "Login realizado",
        user: profile,
      });

    response.cookies.set(
      "sb-access-token",
      accessToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
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
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
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
