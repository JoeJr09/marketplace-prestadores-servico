import { NextResponse, type NextRequest } from "next/server";

const allowedRoles = [
  "CLIENTE",
  "PRESTADOR",
] as const;

type RegisterRole =
  (typeof allowedRoles)[number];

interface RegisterRequestBody {
  email?: string;
  password?: string;
  full_name?: string;
  role?: string;
}

function isRegisterRole(
  role: string | undefined
): role is RegisterRole {
  return allowedRoles.includes(
    role as RegisterRole
  );
}

export async function POST(req: NextRequest) {
  try {
    const body =
      (await req.json()) as RegisterRequestBody;

    const {
      email,
      password,
      full_name,
      role,
    } = body;

    if (!email || !password || !full_name) {
      return NextResponse.json(
        {
          error:
            "Nome, email e senha são obrigatórios",
        },
        {
          status: 400,
        }
      );
    }

    if (!isRegisterRole(role)) {
      return NextResponse.json(
        {
          error: "Role inválida",
        },
        {
          status: 400,
        }
      );
    }

    const { supabase } =
      await import("@/app/lib/supabase");

    const { data, error } =
      await supabase.auth.signUp({
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
          error: profileError.message,
        },
        {
          status: 400,
        }
      );
    }

    if (role === "PRESTADOR") {
      const {
        error: professionalError,
      } = await supabase
        .from("professionals")
        .insert({
          profile_id: data.user.id,
        });

      if (professionalError) {
        return NextResponse.json(
          {
            error:
              professionalError.message,
          },
          {
            status: 400,
          }
        );
      }
    }

    return NextResponse.json(
      {
        message:
          "Usuário criado com sucesso",
      },
      {
        status: 201,
      }
    );
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
