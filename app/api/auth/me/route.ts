import {
  NextResponse,
  type NextRequest,
} from "next/server";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabaseAdmin,
  supabase,
} from "@/app/lib/supabase";
import { updateAuthSchema } from "@/app/types/auth";

const profileSelect =
  "id, full_name, email, phone, avatar_url, role, created_at, updated_at";

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

function getTokenFromRequest(
  req: NextRequest
) {
  return req.cookies.get(
    "sb-access-token"
  )?.value;
}

function getAuthenticatedUserId(
  req: NextRequest
) {
  const token = getTokenFromRequest(req);

  if (!token) {
    return null;
  }

  return verifyAccessToken(token).id;
}

async function getProfileById(id: string) {
  const db = getDatabaseClient();
  const {
    data: profile,
    error,
  } = await db
    .from("profiles")
    .select(profileSelect)
    .eq("id", id)
    .single();

  if (error || !profile) {
    throw new Error(
      error?.message ||
        "Perfil não encontrado"
    );
  }

  return profile;
}

export async function GET(req: NextRequest) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    const profile =
      await getProfileById(userId);

    return NextResponse.json({
      user: profile,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    const parsedBody =
      updateAuthSchema.safeParse(
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

    const {
      email,
      password,
      full_name,
      phone,
      avatar_url,
    } = parsedBody.data;

    if (
      (email || password) &&
      !supabaseAdmin
    ) {
      return NextResponse.json(
        {
          error:
            "Para alterar email ou senha, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 }
      );
    }

    if (supabaseAdmin && (email || password)) {
      const { error } =
        await supabaseAdmin.auth.admin.updateUserById(
          userId,
          {
            email,
            password,
            user_metadata:
              full_name !== undefined
                ? { full_name }
                : undefined,
          }
        );

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    const profileUpdates: Record<
      string,
      string | null
    > = {};

    if (full_name !== undefined) {
      profileUpdates.full_name =
        full_name;
    }

    if (email !== undefined) {
      profileUpdates.email = email;
    }

    if (phone !== undefined) {
      profileUpdates.phone = phone;
    }

    if (avatar_url !== undefined) {
      profileUpdates.avatar_url =
        avatar_url;
    }

    if (
      Object.keys(profileUpdates).length > 0
    ) {
      const db = getDatabaseClient();
      const { error } =
        await db
          .from("profiles")
          .update(profileUpdates)
          .eq("id", userId);

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    const profile =
      await getProfileById(userId);

    return NextResponse.json({
      message:
        "Usuário atualizado com sucesso",
      user: profile,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 }
    );
  }
}

export async function DELETE(
  req: NextRequest
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Não autenticado",
        },
        { status: 401 }
      );
    }

    if (!supabaseAdmin) {
      return NextResponse.json(
        {
          error:
            "Para apagar o usuário autenticado, configure SUPABASE_SERVICE_ROLE_KEY no servidor.",
        },
        { status: 503 }
      );
    }

    const { error: professionalError } =
      await supabaseAdmin
        .from("professionals")
        .delete()
        .eq("profile_id", userId);

    if (professionalError) {
      return NextResponse.json(
        {
          error:
            professionalError.message,
        },
        { status: 400 }
      );
    }

    const { error: profileError } =
      await supabaseAdmin
        .from("profiles")
        .delete()
        .eq("id", userId);

    if (profileError) {
      return NextResponse.json(
        {
          error: profileError.message,
        },
        { status: 400 }
      );
    }

    const { error: authError } =
      await supabaseAdmin.auth.admin.deleteUser(
        userId
      );

    if (authError) {
      return NextResponse.json(
        {
          error: authError.message,
        },
        { status: 400 }
      );
    }

    const response =
      NextResponse.json({
        message:
          "Usuário apagado com sucesso",
      });

    response.cookies.delete(
      "sb-access-token"
    );
    response.cookies.delete(
      "sb-refresh-token"
    );

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error: "Token inválido",
      },
      { status: 401 }
    );
  }
}
