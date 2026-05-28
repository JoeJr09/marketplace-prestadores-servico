import {
  NextResponse,
  type NextRequest,
} from "next/server";

import {
  generateAccessToken,
  generateRefreshToken,
} from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";
import { loginAuthSchema } from "@/app/types/auth";

const profileSelect =
  "id, full_name, email, phone, avatar_url, role, created_at, updated_at";

export async function POST(req: NextRequest) {
  try {
    const parsedBody =
      loginAuthSchema.safeParse(
        await req.json()
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados inválidos",
          details:
            parsedBody.error.flatten()
              .fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password } =
      parsedBody.data;

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error: "Email ou senha inválidos",
        },
        { status: 401 }
      );
    }

    const {
      data: profile,
      error: profileError,
    } = await (supabaseAdmin ?? supabase)
      .from("profiles")
      .select(profileSelect)
      .eq("id", data.user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        {
          error: "Perfil não encontrado",
        },
        { status: 404 }
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
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Erro interno",
      },
      { status: 500 }
    );
  }
}
