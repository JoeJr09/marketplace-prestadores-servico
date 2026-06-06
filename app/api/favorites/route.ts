import {
  NextRequest,
  NextResponse,
} from "next/server";
import { z } from "zod";

import { verifyAccessToken } from "@/app/lib/jwt";
import {
  supabase,
  supabaseAdmin,
} from "@/app/lib/supabase";

const favoritesPayloadSchema = z.object({
  professionalId: z.string().uuid("Id invalido"),
});

function getDatabaseClient() {
  return supabaseAdmin ?? supabase;
}

function getAuthenticatedUserId(
  req: NextRequest,
) {
  const token = req.cookies.get(
    "sb-access-token",
  )?.value;

  if (!token) {
    return null;
  }

  return verifyAccessToken(token).id;
}

async function getAuthenticatedUserRole(
  userId: string,
) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ??
        "Perfil nao encontrado",
    );
  }

  return data.role;
}

async function getFavoriteIdsByUserId(
  userId: string,
) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("favorites")
    .select("professional_id")
    .eq("cliente_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? [])
    .map((favorite) => favorite.professional_id)
    .filter(
      (
        professionalId,
      ): professionalId is string =>
        typeof professionalId === "string",
    );
}

export async function GET(req: NextRequest) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Nao autenticado",
        },
        { status: 401 },
      );
    }

    const role =
      await getAuthenticatedUserRole(
        userId,
      );

    if (role !== "client") {
      return NextResponse.json(
        {
          error:
            "Favoritos disponiveis apenas para clientes",
        },
        { status: 403 },
      );
    }

    const favorites =
      await getFavoriteIdsByUserId(userId);

    return NextResponse.json({
      favorites,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Nao foi possivel carregar os favoritos",
      },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Nao autenticado",
        },
        { status: 401 },
      );
    }

    const role =
      await getAuthenticatedUserRole(
        userId,
      );

    if (role !== "client") {
      return NextResponse.json(
        {
          error:
            "Favoritos disponiveis apenas para clientes",
        },
        { status: 403 },
      );
    }

    const parsedBody =
      favoritesPayloadSchema.safeParse(
        await req.json(),
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados invalidos",
          details:
            parsedBody.error.flatten()
              .fieldErrors,
        },
        { status: 400 },
      );
    }

    const { professionalId } =
      parsedBody.data;
    const db = getDatabaseClient();

    const {
      data: existingFavorite,
      error: existingFavoriteError,
    } = await db
      .from("favorites")
      .select("id")
      .eq("cliente_id", userId)
      .eq("professional_id", professionalId)
      .maybeSingle();

    if (existingFavoriteError) {
      return NextResponse.json(
        {
          error:
            existingFavoriteError.message,
        },
        { status: 400 },
      );
    }

    if (!existingFavorite) {
      const { error } = await db
        .from("favorites")
        .insert({
          cliente_id: userId,
          professional_id: professionalId,
        });

      if (error) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 },
        );
      }
    }

    const favorites =
      await getFavoriteIdsByUserId(userId);

    return NextResponse.json({
      favorites,
      professionalId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Nao foi possivel adicionar o favorito",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  req: NextRequest,
) {
  try {
    const userId =
      getAuthenticatedUserId(req);

    if (!userId) {
      return NextResponse.json(
        {
          error: "Nao autenticado",
        },
        { status: 401 },
      );
    }

    const role =
      await getAuthenticatedUserRole(
        userId,
      );

    if (role !== "client") {
      return NextResponse.json(
        {
          error:
            "Favoritos disponiveis apenas para clientes",
        },
        { status: 403 },
      );
    }

    const parsedBody =
      favoritesPayloadSchema.safeParse(
        await req.json(),
      );

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: "Dados invalidos",
          details:
            parsedBody.error.flatten()
              .fieldErrors,
        },
        { status: 400 },
      );
    }

    const { professionalId } =
      parsedBody.data;
    const db = getDatabaseClient();
    const { error } = await db
      .from("favorites")
      .delete()
      .eq("cliente_id", userId)
      .eq("professional_id", professionalId);

    if (error) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      );
    }

    const favorites =
      await getFavoriteIdsByUserId(userId);

    return NextResponse.json({
      favorites,
      professionalId,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Nao foi possivel remover o favorito",
      },
      { status: 500 },
    );
  }
}
