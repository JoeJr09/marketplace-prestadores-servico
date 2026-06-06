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

const updateServiceRequestSchema = z.object({
  action: z.enum([
    "accept",
    "reject",
    "complete",
    "abort",
  ]),
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

async function getAuthenticatedProfile(
  userId: string,
) {
  const db = getDatabaseClient();
  const { data, error } = await db
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .single();

  if (error || !data) {
    throw new Error(
      error?.message ??
        "Perfil nao encontrado",
    );
  }

  return data;
}

export async function PATCH(
  req: NextRequest,
  context: {
    params: Promise<{ id: string }>;
  },
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

    const profile =
      await getAuthenticatedProfile(userId);

    if (profile.role !== "professional") {
      return NextResponse.json(
        {
          error:
            "Apenas prestadores podem atualizar solicitacoes",
        },
        { status: 403 },
      );
    }

    const parsedBody =
      updateServiceRequestSchema.safeParse(
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

    const { id } =
      await context.params;
    const db = getDatabaseClient();

    const {
      data: professional,
      error: professionalError,
    } = await db
      .from("professionals")
      .select("id, profile_id")
      .eq("profile_id", userId)
      .single();

    if (
      professionalError ||
      !professional
    ) {
      return NextResponse.json(
        {
          error:
            professionalError?.message ??
            "Prestador nao encontrado",
        },
        { status: 404 },
      );
    }

    const {
      data: currentRequest,
      error: currentRequestError,
    } = await db
      .from("calendar")
      .select(
        "id, id_professional, id_cliente, date_service, status",
      )
      .eq("id", id)
      .eq(
        "id_professional",
        professional.id,
      )
      .single();

    if (
      currentRequestError ||
      !currentRequest
    ) {
      return NextResponse.json(
        {
          error:
            currentRequestError?.message ??
            "Solicitacao nao encontrada",
        },
        { status: 404 },
      );
    }

    let nextStatus:
      | "ACEITA"
      | "RECUSADA"
      | "CONCLUIDA"
      | "ABORTADA";

    if (
      parsedBody.data.action ===
      "accept"
    ) {
      nextStatus = "ACEITA";
    } else if (
      parsedBody.data.action ===
      "reject"
    ) {
      nextStatus = "RECUSADA";
    } else if (
      parsedBody.data.action ===
      "complete"
    ) {
      nextStatus = "CONCLUIDA";
    } else {
      nextStatus = "ABORTADA";
    }

    if (
      (parsedBody.data.action ===
        "complete" ||
        parsedBody.data.action ===
          "abort") &&
      currentRequest.status !== "ACEITA"
    ) {
      return NextResponse.json(
        {
          error:
            "Somente solicitacoes aceitas podem ser concluidas ou abortadas",
        },
        { status: 400 },
      );
    }

    if (
      parsedBody.data.action ===
      "accept"
    ) {
      const {
        data: acceptedConflict,
        error: acceptedConflictError,
      } = await db
        .from("calendar")
        .select("id")
        .eq(
          "id_professional",
          professional.id,
        )
        .eq(
          "date_service",
          currentRequest.date_service,
        )
        .eq("status", "ACEITA")
        .neq("id", currentRequest.id)
        .maybeSingle();

      if (acceptedConflictError) {
        return NextResponse.json(
          {
            error:
              acceptedConflictError.message,
          },
          { status: 400 },
        );
      }

      if (acceptedConflict) {
        return NextResponse.json(
          {
            error:
              "Esse horario ja foi aceito em outra solicitacao",
          },
          { status: 409 },
        );
      }
    }

    const { error: updateError } = await db
      .from("calendar")
      .update({
        status: nextStatus,
      })
      .eq("id", currentRequest.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: updateError.message,
        },
        { status: 400 },
      );
    }

    if (
      parsedBody.data.action ===
      "accept"
    ) {
      await db
        .from("calendar")
        .update({
          status: "RECUSADA",
        })
        .eq(
          "id_professional",
          professional.id,
        )
        .eq(
          "date_service",
          currentRequest.date_service,
        )
        .eq("status", "PENDENTE")
        .neq("id", currentRequest.id);
    }

    return NextResponse.json({
      message:
        nextStatus === "ACEITA"
          ? "Solicitacao aceita"
          : nextStatus === "RECUSADA"
            ? "Solicitacao recusada"
            : nextStatus === "CONCLUIDA"
              ? "Solicitacao concluida"
              : "Solicitacao abortada",
      request: {
        ...currentRequest,
        status: nextStatus,
      },
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        error:
          "Nao foi possivel atualizar a solicitacao",
      },
      { status: 500 },
    );
  }
}
