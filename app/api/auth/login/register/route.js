import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(
  req: Request
) {
  try {
    const body = await req.json();

    const {
      email,
      password,
      full_name,
      role,
    } = body;

    /**
     * segurança
     */
    const allowedRoles = [
      "CLIENTE",
      "PRESTADOR",
    ];

    if (
      !allowedRoles.includes(role)
    ) {
      return NextResponse.json(
        {
          error: "Role inválida",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * cria auth
     */
    const {
      data,
      error,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            "Erro ao criar usuário",
        },
        {
          status: 400,
        }
      );
    }

    /**
     * cria profile
     */
    const { error: profileError } =
      await supabase
        .from("profiles")
        .insert({
          id: data.user.id,
          email,
          full_name,
          role,
        });

    if (profileError) {
      return NextResponse.json(
        {
          error:
            profileError.message,
        },
        {
          status: 400,
        }
      );
    }

    /**
     * cria professional
     */
    if (role === "PRESTADOR") {
      await supabase
        .from("professionals")
        .insert({
          profile_id:
            data.user.id,
        });
    }

    return NextResponse.json({
      message:
        "Usuário criado com sucesso",
    });

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